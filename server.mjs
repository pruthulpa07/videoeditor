import express from 'express';
import cors from 'cors';
const app = express(); //Line 2
const port = process.env.PORT || 5000; //Line 3
// const multer = require('multer');
// const upload = multer();
import formidable from 'express-formidable';
import fs from 'fs'
import {createFFmpeg, fetchFile} from '@ffmpeg/ffmpeg';
import PQueue from 'p-queue';

const ffmpeg = createFFmpeg({log:true});

const load = async () => {
    await ffmpeg.load();
}

load();
const requestQueue = new PQueue({ concurrency: 1 });

// This displays message that the server running and listening to specified port
app.listen(port, () => console.log(`Listening on port ${port}`)); //Line 6

app.use(function(req, res, next) {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin")
    res.setHeader("Cross-Origin-Embedder-Policy","require-corp")
    res.setHeader("Accept-Ranges", "bytes")
    res.setHeader("Access-Control-Allow-Origin", "*")
    next();
});

app.use(cors({
    origin: '*'
}));

app.use(formidable());

// create a GET route
app.get('/express_backend', (req, res) => { //Line 9
  res.send({ express: 'YOUR EXPRESS BACKEND IS CONNECTED TO REACT' }); //Line 10
}); //Line 11

app.post('/render',async function(req,res){
    var video = req.files.file;
    var audio = null;
    const toTime = req.fields.to_time
    const fromTime = req.fields.from_time
    const uri = req.fields.image_data
    const renderFormat = req.fields.render_format
    const filter = req.fields.filter_data
    await requestQueue.add(async () => {
    if(req.files.length > 1){
        fs.readFile(req.files[1].file.path, async function(err, data){
            audio = data;
        })
    }
    fs.readFile(req.files.file.path, async function(err, data){
      // Do something with the data (which holds the file information)
      video = data;
      console.log(req.files)
      if(req.files.length > 1){
          var intervalFn = setInterval(()=>{
              console.log('audio loop')
              if(audio != null){
                  clearInterval(intervalFn)
              }
          },2000)
      }
    // console.log(req.fields.image_data)
    ffmpeg.FS('writeFile','test.mp4', await fetchFile(video));
    if(audio != null){
        ffmpeg.FS('writeFile','audio.mp3', await props.fetchFile_(audio));
    }
    
    // await ffmpeg.run('-i', 'test.mp4', '-i', `${uri}`,'-ss',fromTime,'-to',toTime,
    // '-filter_complex', "[0:v][1:v] overlay=0:0:enable='between(t,0,60)'"
    // , 'out.'+renderFormat);
    console.log(req.fields,filter,audio)


    try{
        if(filter != 'none' && audio){
        await ffmpeg.run('-i', 'test.mp4','-ss','00:00:00','-to',toTime,'-vf', filter,'tmp.mp4');
        await ffmpeg.run('-i', 'tmp.mp4', '-i', `${uri}`,'-i','audio.mp3', '-ss',fromTime,'-to',toTime,
        '-filter_complex', "[0:v][1:v] overlay=0:0:enable='between(t,0,60)'"
        ,'-map', '0:v', '-map', '2:a', 'out.'+renderFormat);
        }else if(filter == 'none' && audio){
        await ffmpeg.run('-i', 'test.mp4', '-i', `${uri}`,'-i','audio.mp3', '-ss',fromTime,'-to',toTime,
        '-filter_complex', "[0:v][1:v] overlay=0:0:enable='between(t,0,60)'"
        ,'-map', '0:v', '-map', '2:a', 'out.'+renderFormat);
        }else if(filter != 'none'){
        await ffmpeg.run('-i', 'test.mp4','-ss','00:00:00','-to',toTime,'-vf', filter,'tmp.mp4');
        await ffmpeg.run('-i', 'tmp.mp4', '-i', `${uri}`,'-ss',fromTime,'-to',toTime,
        '-filter_complex', "[0:v][1:v] overlay=0:0:enable='between(t,0,60)'"
        , 'out.'+renderFormat);
        }else{
        await ffmpeg.run('-i', 'test.mp4', '-i', `${uri}`,'-ss',fromTime,'-to',toTime,
        '-filter_complex', "[0:v][1:v] overlay=0:0:enable='between(t,0,60)'"
        , 'out.'+renderFormat);
        }
    }catch{
        // handleCloseEditor()
    }



    const outputData = ffmpeg.FS('readFile','out.'+renderFormat);
    const outputFileName = 'out.'+renderFormat;
    ffmpeg.FS('unlink', 'out.'+renderFormat);
    ffmpeg.FS('unlink', 'test.mp4');
    // res.sendFile(outputData)
    res.writeHead(200, {
        'Content-Type': renderFormat == 'gif' ?'image/gif':'video/mp4',
        'Content-Disposition': `attachment;filename=${outputFileName}`,
        'Content-Length': outputData.length
    });
    res.end(Buffer.from(outputData, 'binary'));
    });
    });
    
    
  });

app.use(express.static("build"));

app.post('/save', function(req,res){
    console.log(req)
    // var buf = Buffer.from(req.fields.file);
    // fs.writeFile('out.mp4', buf, /* callback will go here */
    //         function(err) {
    //         if(err) {
    //             return console.log(err);
    //         }
    //         console.log("The file was saved!");
    //         }
    // );
    // fs.createWriteStream('out.mp4').write(buf)
    fs.readFile(req.files.file.path, async function(err, data){
        fs.writeFile("./build/out.mp4", data, function(err) {
            if(err) {
                return console.log(err);
            }
            console.log("The file was saved!");
        }); 
    })
})