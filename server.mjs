import express from 'express';
import cors from 'cors';
import schedule from 'node-schedule';
const app = express(); //Line 2
const port = process.env.PORT || 5000; //Line 3
// const multer = require('multer');
// const upload = multer();
import formidable from 'express-formidable';
import fs from 'fs'
import http from'http'
import {createFFmpeg, fetchFile} from '@ffmpeg/ffmpeg';
import PQueue from 'p-queue';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
var getDirName = path.dirname;
// import https from'https';

// const options = {
//   key: fs.readFileSync('key.pem'),
//   cert: fs.readFileSync('cert.pem')
// };



const ffmpeg = createFFmpeg({log:true});

const load = async () => {
    await ffmpeg.load();
}

load();
const requestQueue = new PQueue({ concurrency: 1 });

// This displays message that the server running and listening to specified port
app.listen(port, () => console.log(`Listening on port ${port}`)); //Line 6
// https.createServer(options, app).listen(port);

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
    var anim = null;
    const toTime = req.fields.to_time
    const email = req.fields.user
    // const toTime = '00:00:02'
    const fromTime = req.fields.from_time
    const uri = req.fields.image_data
    const renderFormat = req.fields.render_format
    const filter = req.fields.filter_data
    const startAudioTimeSec = req.fields.startAudioTimeSec
    const stopAudioTimeSec = req.fields.stopAudioTimeSec
    const scale = parseFloat(req.fields.scale)
    // const scale = 1.539
    var videoElement = {
        'videoWidth': parseInt(req.fields.video_width),
        'videoHeight': parseInt(req.fields.video_height),
    }

    // console.log(req)
    await requestQueue.add(async () => {
    // if('audio_file' in req.files){
    //     fs.readFile(req.files.audio_file.path, async function(err, data){
    //         audio = data;
    //         console.log('audio 1')
    //     })
    // }

    
    
    fs.readFile(req.files.file.path, async function(err, data){
      // Do something with the data (which holds the file information)
      video = data;
    //   console.log(req.files)
      if('audio_file' in req.files){
        fs.readFile(req.files.audio_file.path, async function(err, data2){

            if('anim_file' in req.files){
                fs.readFile(req.files.anim_file.path, async function(err, data){
                    anim = data;
                    audio = data2;
                    console.log('audio 1')
                    ffmpeg.FS('writeFile','test.mp4', await fetchFile(video));
                    ffmpeg.FS('writeFile','anim.mp4', await fetchFile(anim));
                    // if(audio != null){
                    //     ffmpeg.FS('writeFile','audio.mp3', await props.fetchFile_(audio));
                    // }
                    ffmpeg.FS('writeFile','audio.mp3', await fetchFile(audio));
                    
                    // await ffmpeg.run('-i', 'test.mp4', '-i', `${uri}`,'-ss',fromTime,'-to',toTime,
                    // '-filter_complex', "[0:v][1:v] overlay=0:0:enable='between(t,0,60)'"
                    // , 'out.'+renderFormat);
                    // console.log(req.fields,filter,audio)


                    try{
                        if(filter != 'none' && audio && renderFormat == 'gif'){
                        await ffmpeg.run('-i', 'test.mp4','-ss','00:00:00','-to',toTime,'-vf', filter,'tmp.mp4');
                        await ffmpeg.run('-i', 'tmp.mp4', '-i', `${uri}`,'-ss',fromTime,'-to',toTime,
                        '-filter_complex', `[1:v]scale=${videoElement.videoWidth}:${videoElement.videoHeight} [ovrl],[0:v][ovrl] overlay=0:0`
                        , 'out.'+renderFormat);
                        }else if(filter == 'none' && audio && renderFormat == 'gif'){
                        await ffmpeg.run('-i', 'test.mp4', '-i', `${uri}`,'-ss',fromTime,'-to',toTime,
                        '-filter_complex', `[1:v]scale=${videoElement.videoWidth}:${videoElement.videoHeight} [ovrl],[0:v][ovrl] overlay=0:0`
                        , 'out.'+renderFormat);
                        }else if(filter != 'none' && audio){
                        await ffmpeg.run('-i', 'test.mp4','-ss','00:00:00','-to',toTime,'-vf', filter,'tmp.mp4');
                        await ffmpeg.run('-i', 'tmp.mp4', '-i', `${uri}`,'-i','audio.mp3', '-ss',fromTime,'-to',toTime,
                        '-filter_complex', `[1:v]scale=${videoElement.videoWidth}:${videoElement.videoHeight} [ovrl],[0:v][ovrl] overlay=0:0;[2:a]atrim=start=${parseInt(startAudioTimeSec)}:end=${parseInt(stopAudioTimeSec)},asetpts=PTS-STARTPTS [a0]`
                        ,'-map', '0:v', '-map', '[a0]', 'out.'+renderFormat);
                        }else if(filter == 'none' && audio){
                        await ffmpeg.run('-i', 'test.mp4', '-i', `${uri}`,'-i','audio.mp3', '-ss',fromTime,'-to',toTime,
                        '-filter_complex', `[1:v]scale=${videoElement.videoWidth}:${videoElement.videoHeight} [ovrl],[0:v][ovrl] overlay=0:0;[2:a]atrim=start=${parseInt(startAudioTimeSec)}:end=${parseInt(stopAudioTimeSec)},asetpts=PTS-STARTPTS [a0]`
                        ,'-map', '0:v', '-map', '[a0]', 'out.'+renderFormat);
                        }else if(filter != 'none'){
                        await ffmpeg.run('-i', 'test.mp4','-ss','00:00:00','-to',toTime,'-vf', filter,'tmp.mp4');
                        await ffmpeg.run('-i', 'tmp.mp4', '-i', `${uri}`,'-ss',fromTime,'-to',toTime,
                        '-filter_complex', `[1:v]scale=${videoElement.videoWidth}:${videoElement.videoHeight} [ovrl],[0:v][ovrl] overlay=0:0`
                        , 'out.'+renderFormat);
                        }else{
                        await ffmpeg.run('-i', 'test.mp4', '-i', `${uri}`,'-ss',fromTime,'-to',toTime,
                        '-filter_complex', `[1:v]scale=${videoElement.videoWidth}:${videoElement.videoHeight} [ovrl],[0:v][ovrl] overlay=0:0`
                        , 'out.'+renderFormat);
                        }

                        await ffmpeg.run('-i', 'out.'+renderFormat, '-i', 'anim.mp4', '-filter_complex',
                        "[1:v][0:v]scale2ref[v1][v0];[v1]colorkey=0x000000:0.3:0.2[ckout];[0:v][ckout]overlay[out]",
                            '-map', '[out]', 'out1.'+renderFormat,'-map', '[v0]','temp.mp4')
                    }catch{
                        // handleCloseEditor()
                    }



                    const outputData = ffmpeg.FS('readFile','out1.'+renderFormat);
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

                    const now = String(Date.now())

                    fs.mkdir("./video/"+email, { recursive: true}, function (err) {
                        if (err) return cb(err);
                    
                        fs.writeFile("./video/"+email+"/"+now+".mp4", outputData, function(err) {
                            if(err) {
                                return console.log(err);
                            }
                            console.log("The file was saved!");
                        }); 
                    });
                })
            }else{
                audio = data2;
                console.log('audio 1')
                ffmpeg.FS('writeFile','test.mp4', await fetchFile(video));
                // if(audio != null){
                //     ffmpeg.FS('writeFile','audio.mp3', await props.fetchFile_(audio));
                // }
                ffmpeg.FS('writeFile','audio.mp3', await fetchFile(audio));
                
                // await ffmpeg.run('-i', 'test.mp4', '-i', `${uri}`,'-ss',fromTime,'-to',toTime,
                // '-filter_complex', "[0:v][1:v] overlay=0:0:enable='between(t,0,60)'"
                // , 'out.'+renderFormat);
                // console.log(req.fields,filter,audio)


                try{
                    if(filter != 'none' && audio && renderFormat == 'gif'){
                    await ffmpeg.run('-i', 'test.mp4','-ss','00:00:00','-to',toTime,'-vf', filter,'tmp.mp4');
                    await ffmpeg.run('-i', 'tmp.mp4', '-i', `${uri}`,'-ss',fromTime,'-to',toTime,
                    '-filter_complex', `[1:v]scale=${videoElement.videoWidth}:${videoElement.videoHeight} [ovrl],[0:v][ovrl] overlay=0:0`
                    , 'out.'+renderFormat);
                    }else if(filter == 'none' && audio && renderFormat == 'gif'){
                    await ffmpeg.run('-i', 'test.mp4', '-i', `${uri}`,'-ss',fromTime,'-to',toTime,
                    '-filter_complex', `[1:v]scale=${videoElement.videoWidth}:${videoElement.videoHeight} [ovrl],[0:v][ovrl] overlay=0:0`
                    , 'out.'+renderFormat);
                    }else if(filter != 'none' && audio){
                    await ffmpeg.run('-i', 'test.mp4','-ss','00:00:00','-to',toTime,'-vf', filter,'tmp.mp4');
                    await ffmpeg.run('-i', 'tmp.mp4', '-i', `${uri}`,'-i','audio.mp3', '-ss',fromTime,'-to',toTime,
                    '-filter_complex', `[1:v]scale=${videoElement.videoWidth}:${videoElement.videoHeight} [ovrl],[0:v][ovrl] overlay=0:0;[2:a]atrim=start=${parseInt(startAudioTimeSec)}:end=${parseInt(stopAudioTimeSec)},asetpts=PTS-STARTPTS [a0]`
                    ,'-map', '0:v', '-map', '[a0]', 'out.'+renderFormat);
                    }else if(filter == 'none' && audio){
                    await ffmpeg.run('-i', 'test.mp4', '-i', `${uri}`,'-i','audio.mp3', '-ss',fromTime,'-to',toTime,
                    '-filter_complex', `[1:v]scale=${videoElement.videoWidth}:${videoElement.videoHeight} [ovrl],[0:v][ovrl] overlay=0:0;[2:a]atrim=start=${parseInt(startAudioTimeSec)}:end=${parseInt(stopAudioTimeSec)},asetpts=PTS-STARTPTS [a0]`
                    ,'-map', '0:v', '-map', '[a0]', 'out.'+renderFormat);
                    }else if(filter != 'none'){
                    await ffmpeg.run('-i', 'test.mp4','-ss','00:00:00','-to',toTime,'-vf', filter,'tmp.mp4');
                    await ffmpeg.run('-i', 'tmp.mp4', '-i', `${uri}`,'-ss',fromTime,'-to',toTime,
                    '-filter_complex', `[1:v]scale=${videoElement.videoWidth}:${videoElement.videoHeight} [ovrl],[0:v][ovrl] overlay=0:0`
                    , 'out.'+renderFormat);
                    }else{
                    await ffmpeg.run('-i', 'test.mp4', '-i', `${uri}`,'-ss',fromTime,'-to',toTime,
                    '-filter_complex', `[1:v]scale=${videoElement.videoWidth}:${videoElement.videoHeight} [ovrl],[0:v][ovrl] overlay=0:0`
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

                const now = String(Date.now())

                fs.mkdir("./video/"+email, { recursive: true}, function (err) {
                    if (err) return cb(err);
                
                    fs.writeFile("./video/"+email+"/"+now+".mp4", outputData, function(err) {
                        if(err) {
                            return console.log(err);
                        }
                        console.log("The file was saved!");
                    }); 
                });
            }
        })
      }else{
        ffmpeg.FS('writeFile','test.mp4', await fetchFile(video));
        if('anim_file' in req.files){
            fs.readFile(req.files.anim_file.path, async function(err, data){
                anim = data
                ffmpeg.FS('writeFile','anim.mp4', await fetchFile(anim));
                try{
                    if(filter != 'none' && audio){
                    await ffmpeg.run('-i', 'test.mp4','-ss','00:00:00','-to',toTime,'-vf', filter,'tmp.mp4');
                    await ffmpeg.run('-i', 'tmp.mp4', '-i', `${uri}`,'-i','audio.mp3', '-ss',fromTime,'-to',toTime,
                    '-filter_complex', `[1:v]scale=${videoElement.videoWidth}:${videoElement.videoHeight} [ovrl],[0:v][ovrl] overlay=0:0;[2:a]atrim=start=${parseInt(startAudioTimeSec)}:end=${parseInt(stopAudioTimeSec)},asetpts=PTS-STARTPTS [a0]`
                    ,'-map', '0:v', '-map', '[a0]', 'out.'+renderFormat);
                    }else if(filter == 'none' && audio){
                    await ffmpeg.run('-i', 'test.mp4', '-i', `${uri}`,'-i','audio.mp3', '-ss',fromTime,'-to',toTime,
                    '-filter_complex', `[1:v]scale=${videoElement.videoWidth}:${videoElement.videoHeight} [ovrl],[0:v][ovrl] overlay=0:0;[2:a]atrim=start=${parseInt(startAudioTimeSec)}:end=${parseInt(stopAudioTimeSec)},asetpts=PTS-STARTPTS [a0]`
                    ,'-map', '0:v', '-map', '[a0]', 'out.'+renderFormat);
                    }else if(filter != 'none'){
                    await ffmpeg.run('-i', 'test.mp4','-ss','00:00:00','-to',toTime,'-vf', filter,'tmp.mp4');
                    await ffmpeg.run('-i', 'tmp.mp4', '-i', `${uri}`,'-ss',fromTime,'-to',toTime,
                    '-filter_complex', `[1:v]scale=${videoElement.videoWidth}:${videoElement.videoHeight} [ovrl],[0:v][ovrl] overlay=0:0`
                    , 'out.'+renderFormat);
                    }else{
                    await ffmpeg.run('-i', 'test.mp4', '-i', `${uri}`,'-ss',fromTime,'-to',toTime,
                    '-filter_complex', `[1:v]scale=${videoElement.videoWidth}:${videoElement.videoHeight} [ovrl],[0:v][ovrl] overlay=0:0`
                    , 'out.'+renderFormat);
                    }
                    await ffmpeg.run('-i', 'out.'+renderFormat, '-i', 'anim.mp4', '-filter_complex',
                        "[1:v][0:v]scale2ref[v1][v0];[v1]colorkey=0x000000:0.3:0.2[ckout];[0:v][ckout]overlay[out]",
                            '-map', '[out]', 'out1.'+renderFormat,'-map', '[v0]','temp.mp4')
                }catch{
                    // handleCloseEditor()
                }
            
            
            
                const outputData = ffmpeg.FS('readFile','out1.'+renderFormat);
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
        
                const now = String(Date.now())
        
                fs.mkdir("./video/"+email, { recursive: true}, function (err) {
                    if (err) return cb(err);
                
                    fs.writeFile("./video/"+email+"/"+now+".mp4", outputData, function(err) {
                        if(err) {
                            return console.log(err);
                        }
                        console.log("The file was saved!");
                    }); 
                });
            })}else{
        // if(audio != null){
        //     ffmpeg.FS('writeFile','audio.mp3', await props.fetchFile_(audio));
        // }
        // ffmpeg.FS('writeFile','audio.mp3', await fetchFile(audio));
        
        // await ffmpeg.run('-i', 'test.mp4', '-i', `${uri}`,'-ss',fromTime,'-to',toTime,
        // '-filter_complex', "[0:v][1:v] overlay=0:0:enable='between(t,0,60)'"
        // , 'out.'+renderFormat);
        // console.log(req.fields,filter,audio)
    
    
        try{
            if(filter != 'none' && audio){
            await ffmpeg.run('-i', 'test.mp4','-ss','00:00:00','-to',toTime,'-vf', filter,'tmp.mp4');
            await ffmpeg.run('-i', 'tmp.mp4', '-i', `${uri}`,'-i','audio.mp3', '-ss',fromTime,'-to',toTime,
            '-filter_complex', `[1:v]scale=${videoElement.videoWidth}:${videoElement.videoHeight} [ovrl],[0:v][ovrl] overlay=0:0;[2:a]atrim=start=${parseInt(startAudioTimeSec)}:end=${parseInt(stopAudioTimeSec)},asetpts=PTS-STARTPTS [a0]`
            ,'-map', '0:v', '-map', '[a0]', 'out.'+renderFormat);
            }else if(filter == 'none' && audio){
            await ffmpeg.run('-i', 'test.mp4', '-i', `${uri}`,'-i','audio.mp3', '-ss',fromTime,'-to',toTime,
            '-filter_complex', `[1:v]scale=${videoElement.videoWidth}:${videoElement.videoHeight} [ovrl],[0:v][ovrl] overlay=0:0;[2:a]atrim=start=${parseInt(startAudioTimeSec)}:end=${parseInt(stopAudioTimeSec)},asetpts=PTS-STARTPTS [a0]`
            ,'-map', '0:v', '-map', '[a0]', 'out.'+renderFormat);
            }else if(filter != 'none'){
            await ffmpeg.run('-i', 'test.mp4','-ss','00:00:00','-to',toTime,'-vf', filter,'tmp.mp4');
            await ffmpeg.run('-i', 'tmp.mp4', '-i', `${uri}`,'-ss',fromTime,'-to',toTime,
            '-filter_complex', `[1:v]scale=${videoElement.videoWidth}:${videoElement.videoHeight} [ovrl],[0:v][ovrl] overlay=0:0`
            , 'out.'+renderFormat);
            }else{
            await ffmpeg.run('-i', 'test.mp4', '-i', `${uri}`,'-ss',fromTime,'-to',toTime,
            '-filter_complex', `[1:v]scale=${videoElement.videoWidth}:${videoElement.videoHeight} [ovrl],[0:v][ovrl] overlay=0:0`
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

        const now = String(Date.now())

        fs.mkdir("./video/"+email, { recursive: true}, function (err) {
            if (err) return cb(err);
        
            fs.writeFile("./video/"+email+"/"+now+".mp4", outputData, function(err) {
                if(err) {
                    return console.log(err);
                }
                console.log("The file was saved!");
            }); 
        });

    }

      }
    // console.log(req.fields.image_data)
    
    });
    });
    
    
  });

app.use(express.static("build"));

app.post('/save', function(req,res){
    console.log("save called")
    const now = String(Date.now())
    fs.readFile(req.files.file.path, async function(err, data){
        fs.mkdir("./video/"+req.fields.user, { recursive: true}, function (err) {
            if (err) return cb(err);
        
            fs.writeFile("./video/"+req.fields.user+"/"+now+".mp4", data, function(err) {
                if(err) {
                    res.end({error:err})
                    return console.log(err);
                }
                console.log("The file was saved!");
            }); 
          });
        
    })
})

app.post('/save_video', function(req,res){
    console.log(req)
    const now = String(Date.now())
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
        fs.writeFile("./video/"+ req.files.file.outputFileName +"/" + now + ".mp4", data, function(err) {
            if(err) {
                return console.log(err);
            }
            console.log("The file was saved!");
        }); 
    })
})

// serve video files
app.use("/video/:user/:videofile", function(req,res){
    console.log(__dirname +"/video/" + req.params.user +"/"+ req.params.videofile)
    express.static(__dirname +"/video/" + req.params.user +"/"+ req.params.videofile)
})

// http server
http.createServer(function (req, res) {
    const url_parts = req.url.split("/")
	console.log();
	// change the MIME type to 'video/mp4'
    res.writeHead(200, {'Content-Type': 'video/mp4',"Access-Control-Allow-Origin": "*"});
    fs.exists(__dirname +"/video/" + url_parts[2] +"/"+ url_parts[3],function(exists){
		if(exists)
		{
			var rstream = fs.createReadStream(__dirname +"/video/" + url_parts[2] +"/"+ url_parts[3]);
			rstream.pipe(res);
		}
		else
		{
			res.send("Its a 404");
			res.end();
		}
	});
}).listen(4000);

// get list of videos
app.get('/video_list', (req, res) => { //Line 9
    // console.log(req.query.user)

    fs.readdir(__dirname +"/video/" + req.query.user, (err, files) => {
        res.send({ videos: files }); //Line 10
      });
    
  }); //Line 11

schedule.scheduleJob('0 0 * * *', () => {
    fs.readdir(__dirname +"/video",(err, subdirs) => {
        var currentTime = +new Date()
        subdirs.forEach(folder => {
            fs.readdir(__dirname +"/video/" + folder, (err, files) => {
                files.forEach(file => {
                    // console.log(__dirname +"/video/" + folder + "/" + file)
                    var fileTime = new Date(file.split(".")[0])
                    // console.log(parseInt(file.split(".")[0]))
                    if (currentTime - parseInt(file.split(".")[0]) > (86400000*5)) {
                        fs.unlinkSync(__dirname +"/video/" + folder + "/" + file);
                        console.log(__dirname +"/video/" + folder + "/" + file)
                    }
                });
            });
        });
    })
    
})