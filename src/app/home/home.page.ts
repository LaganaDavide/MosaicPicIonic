import { Component, OnInit} from '@angular/core';
import { Camera, CameraOptions } from '@ionic-native/camera/ngx';
import { AlertController } from '@ionic/angular';
import { ImagePicker, ImagePickerOptions} from '@ionic-native/image-picker/ngx';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit{

  mainImage: any;
  mainImagePixel : {};
  cardsImage : any[];
  
  constructor(private camera: Camera, private alertController: AlertController,
    private imagePicker: ImagePicker) {}

  ngOnInit(): void {
    this.requestReadPermission();
  }

  requestReadPermission() {
    // no callbacks required as this opens a popup which returns async
    this.imagePicker.requestReadPermission();
  }

  takePicture() {
    const options: CameraOptions = {
      quality: 100,
      destinationType: this.camera.DestinationType.DATA_URL,
      encodingType: this.camera.EncodingType.JPEG,
      mediaType: this.camera.MediaType.PICTURE,
      sourceType: this.camera.PictureSourceType.PHOTOLIBRARY,
    };

    this.camera.getPicture(options).then((imageData) => {
      this.mainImage = 'data:image/jpeg;base64,' + imageData;
      this.getPixel();
    }, (err) => {
      // Handle error
      console.log("Camera issue:" + err);
    });
  }

  takePictures(){

    const options: ImagePickerOptions = {
      maximumImagesCount: 3, 
      quality: 90, 
      width: 800, 
      height: 800,
      outputType : 1
    };

    this.imagePicker.hasReadPermission().then(
      (result) =>{
        if (result == false){
          this.requestReadPermission();
        }else{
          this.imagePicker.getPictures(options).then((results) => {
            for (var i = 0; i < results.length; i++) {
                console.log('Image URI: ' + results[i]);
            }
          }, (err) => { 
            // Handle error
            console.log("Camera issue:" + err);
          });
        }
      }
    )
  }


  getPixel() {
    let image = new Image();
    let res : any[];
    image.onload = ()=> {
        let canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;

        let context = canvas.getContext('2d');
        context.drawImage(image, 0, 0);

        let imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        console.log(imageData);
        // Now you can access pixel data from imageData.data.
        // It's a one-dimensional array of RGBA values.
        // Here's an example of how to get a pixel's color at (x,y)
        let red = 0;
        let green = 0;
        let blue = 0;
        let alpha = 0;
        let num = 0;
        for (let x = 0; x < imageData.width; x++){
          for (let y=0 ; y < imageData.height ; y++){
            let index = (y*imageData.width + x) * 4;
            red += imageData.data[index];
            green += imageData.data[index + 1];
            blue += imageData.data[index + 2];
            alpha += imageData.data[index + 3];
            num ++;
          }
        }
        red = Math.round(red /num);
        green = Math.round(green/num);
        blue = Math.round(blue /num);
        alpha = Math.round(alpha/num);
        console.log(imageData.width);
        console.log([num, red, green, blue, alpha]);
        this.mainImagePixel = { red : red, green : green , blue : blue, alpha : alpha};
    };
    image.src = this.mainImage;
    return res;
  }

}
