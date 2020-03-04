import { Component, OnInit} from '@angular/core';
import { Camera, CameraOptions } from '@ionic-native/camera/ngx';
import { AlertController } from '@ionic/angular';
import { ImagePicker, ImagePickerOptions} from '@ionic-native/image-picker/ngx';
//import { FileTransfer, FileTransferObject } from '@ionic-native/file-transfer/ngx';
//import { File } from '@ionic-native/file';
import { Base64ToGallery } from '@ionic-native/base64-to-gallery/ngx';
import { AndroidPermissions } from '@ionic-native/android-permissions/ngx';
import { ModalController } from '@ionic/angular';
import { AboutPage } from '../about/about.page';
import { LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit{

  mainImg: any; //Main image selected
  cardImgs = []; //Image selected for the cards 
  public message: string;
  mainImgPixel = []; //average of pixel colour of the rectangles of main image
  cardImgsPixel = []; //average of pixel colour of the cards selected
  cradImgElem = []; //javascript element of the card image
  numRec = 50; // number of rectangle which the main image must been divide
  result = "";
  page = 1;
  //fileTransfer: FileTransferObject = this.transfer.create();

  constructor(private camera: Camera, private alertController: AlertController,
    private imagePicker: ImagePicker,
    private base64ToGallery: Base64ToGallery,
    private androidPermissions: AndroidPermissions,
    private modalController: ModalController,
    public loadingController: LoadingController
    //,private transfer: FileTransfer, private file: File
    ) {}

  ngOnInit(): void {
    this.requestReadPermission();
  }

  requestReadPermission() {
    this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.WRITE_EXTERNAL_STORAGE).then(
      result => {
        if (result.hasPermission == false){
          this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.WRITE_EXTERNAL_STORAGE)
        }
        console.log('Has permission?',result.hasPermission)
      },
      err => this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.WRITE_EXTERNAL_STORAGE)
    );
  }

  preview() {
    this.mainImgPixel = []
    const options: CameraOptions = {
      quality: 100,
      destinationType: this.camera.DestinationType.DATA_URL,
      encodingType: this.camera.EncodingType.JPEG,
      mediaType: this.camera.MediaType.PICTURE,
      sourceType: this.camera.PictureSourceType.PHOTOLIBRARY,
    };

    this.camera.getPicture(options).then((imageData) => {
      this.presentLoadingMain().then(()=>{
        this.mainImg = 'data:image/jpeg;base64,' + imageData;
        this.loadingController.dismiss();
      })
    }, (err) => {
      // Handle error
      console.log("Camera issue:" + err);
    });
  }

  async presentLoadingMain() {
    const loading = await this.loadingController.create({
      message: 'Please wait...'
    });
    await loading.present();
  }

  previewMult(){
    this.cardImgs = [];
    this.cardImgsPixel = [];
    const options: ImagePickerOptions = {
      maximumImagesCount: 50, 
      quality: 90, 
      width: 800, 
      height: 800,
      outputType : 1
    };

    this.imagePicker.hasReadPermission().then(
      (result) =>{
        this.imagePicker.getPictures(options).then((results) => {
          this.presentLoadingMain().then(()=>{ 
            for (var i = 0; i < results.length; i++) {
              this.cardImgs.push( 'data:image/jpeg;base64,' + results[i]); 
              this.getPixel(this.cardImgs.length -1);
            }
            this.loadingController.dismiss(); 
           });
      }, (err) => { 
          console.log("Camera issue:" + err);
        }
    );
  });
};

  async presentAlert() {
    const alert = await this.alertController.create({
      header: '!!',
      message: 'Fist select the main image and the cards image.',
      buttons: ['OK']
    });

    await alert.present();
  }

  createMosaic(){ 
    if ( this.mainImg == "" || this.mainImg == undefined || this.cardImgs.length < 1  ){
      this.presentAlert();
      return;
    }
    this.page = 2;
    let image = new Image();
    this.mainImgPixel = [];
    image.onload = ()=> {
      this.presentLoadingMain().then(()=>{
        this.loadingController.dismiss();
        let cardwidth = image.width / this.numRec ; 
        let cardHeight = image.height / this.numRec;
        let canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        
        let hidden_ctx = canvas.getContext('2d');
        hidden_ctx.drawImage(image, 0, 0);
        //divide the image in rec section and calculate the average
        for (let i = 0; i < this.numRec; i ++){
          this.mainImgPixel[i] = [];
          for (let j = 0; j < this.numRec; j ++){
            let imageData = hidden_ctx.getImageData(i*cardwidth,j*cardHeight,cardwidth, cardHeight);
            this.mainImgPixel[i][j] = this.averagePixel(imageData);
          };
        };
        //define which card must put in all section
        for (let i = 0 ; i < this.mainImgPixel.length; i ++){
          for (let j = 0 ; j < this.mainImgPixel[i].length; j ++){
            let prossimity = 1000;
            let sel = 0;
            for (let z = 0 ; z < this.cardImgsPixel.length; z ++){
              let temp = 0;
              temp = temp + Math.abs(this.mainImgPixel[i][j].red - this.cardImgsPixel[z].red);
              temp = temp + Math.abs(this.mainImgPixel[i][j].green - this.cardImgsPixel[z].green);
              temp = temp + Math.abs(this.mainImgPixel[i][j].blue - this.cardImgsPixel[z].blue);
              temp = temp + Math.abs(this.mainImgPixel[i][j].alpha - this.cardImgsPixel[z].alpha);
              if (temp < prossimity){
                prossimity = temp;
                sel = z;
              }
            }
            //draw the card image in section
            hidden_ctx.drawImage(this.cradImgElem[sel],i*cardwidth,j*cardHeight,cardwidth, cardHeight);
          }
        }
        
        this.result = canvas.toDataURL("image/png");
        this.loadingController.dismiss();
        });
      
    };
    image.src = this.mainImg;   
  }

  //calculate pixel average color of cards image and save it in relative array
  getPixel(i) {
    this.cradImgElem[i] = new Image();
    this.cradImgElem[i].onload = ()=> {
        let canvas = document.createElement('canvas');
        canvas.width = this.cradImgElem[i].width;
        canvas.height = this.cradImgElem[i].height;

        let context = canvas.getContext('2d');
        context.drawImage(this.cradImgElem[i], 0, 0);

        let imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        this.cardImgsPixel[i] = this.averagePixel(imageData) ;
        canvas = null;
    };
    this.cradImgElem[i].src = this.cardImgs[i];
    return;
  }

  averagePixel(imageData){
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
        return { red : red, green : green , blue : blue, alpha : alpha}; 
  }

  async downloadAlert() {
    const alert = await this.alertController.create({
      header: 'OK',
      message: 'Download complete.',
      buttons: ['OK']
    });

    await alert.present();
  }

  async downloadAlertErr() {
    const alert = await this.alertController.create({
      header: 'ERROR',
      message: 'Download error',
      buttons: ['OK']
    });

    await alert.present();
  }

  download(){
      
      this.base64ToGallery.base64ToGallery(this.result, { prefix: '_img', mediaScanner: true }).then(
        res => {
          console.log('Saved image to gallery ', res)
          this.downloadAlert();
        },
        err => {
          console.log('Error saving image to gallery ', err);
          this.downloadAlertErr();
        }
      );
  }
  reset (){
    this.mainImg = ""; //Main image selected
    this.cardImgs = []; //Image selected for the cards 
    this.message = "";
    this.mainImgPixel = []; //average of pixel colour of the rectangles of main image
    this.cardImgsPixel = []; //average of pixel colour of the cards selected
    this.cradImgElem = [];
    this.page = 1;
  }
  
  async presentAbout() {
    const modal = await this.modalController.create({
      component: AboutPage
    });
    return await modal.present();
  }
  
}
