const sizeOf = require('image-size');
var jimp = require('jimp');

const { connectToDB } = require('./lib/mongo');
const { connectToRabbitMQ, getChannel } = require('./lib/rabbitmq');
const {
  saveImageFile,
  getPhotoById,
  getFileDownloadStreamById,
  updateImageSizeById,
  getImageInfoById
} = require('./models/photo');


async function resizeImage(id, imageData, buffer, len) {
  const orig_photo = await getImageInfoById(id); // Gets the original photo
  const image = await jimp.read(buffer);
  const mime = image._originalMime ? image._originalMime : jimp.MIME_JPEG;
  const newFileName = len + "_" + orig_photo.filename;
  const newPath = __dirname + "/uploads/" + newFileName;
   image.resize(len,len).write(newPath);
   const newImage = {
     path: newPath,
     filename: newFileName,
     contentType: mime,
     businessId: orig_photo.metadata.businessId,
     Caption: orig_photo.metadata.Caption
   };
   const newid = await saveImageFile(newImage);
   // console.log("Successfully added the New image! ID: ", newid);
   return newid;
   //const key = len.toString();
   //resizedImages.key = newid;
}

async function main() {
  try {
    await connectToRabbitMQ('images');
    const channel = getChannel();

    channel.consume('images', (msg) => {
      if (msg) {
        const id = msg.content.toString();
        const downloadStream = getFileDownloadStreamById(id);
        const imageData = [];
        var resizedImages = {};
        var urlImages = {};
        downloadStream.on('data', (data) => {
          imageData.push(data);
        });
        downloadStream.on('end', async () => {
          const dimensions = sizeOf(Buffer.concat(imageData));
          const maxSide = Math.max(dimensions.width, dimensions.height);
          const buffer = Buffer.concat(imageData);
          const orig_photos = await getImageInfoById(id);
          resizedImages["orig"]=orig_photos._id;
          urlImages["orig"]= "photos/media/photos/" + orig_photos._id + "-orig.jpg";
          const imageSizes = [128, 256, 640, 1024];
          // Create resized images
          var i = 0;
          while (imageSizes[i] < maxSide) {
            const newid = await resizeImage(id, imageData, buffer, imageSizes[i]);
            const key = imageSizes[i].toString();
            resizedImages[key]=newid;
            urlImages[key]="photos/media/photos/" + newid + "-"+key+".jpg";
            // resizedImages["test"] = 4;
            // resizedImages.key = newid;
            i++;
          }
          // console.log("==urlImages " ,urlImages);
                  updateImageSizeById(id, resizedImages,urlImages);
        });
        // console.log("==resizedImages " ,resizedImages);
        // updateImageSizeById(id, resizedImages);
      }
      channel.ack(msg);
    });
  } catch (err) {
    console.error(err);
  }
}
connectToDB(main);
