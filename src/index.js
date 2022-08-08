const LIBRARIES = {
  FS: require("fs"),
  Path: require("path"),
  ChildProcess: require("child_process"),

  Skill: require("../../../Libraries/Skill")
};

class STTVosk extends LIBRARIES.Skill{
  constructor(_main, _settings) {
    super(_main, _settings);
    const SELF = this;

    SELF.Terminal("python3 --version", _path, function (_error_code, _messages) {
        if (_error_code === 0) {
            console.log(_messages);
        } else {
            //console.log("npm install error : " + _error_code);
        }
    });

    SELF.Main.STT = SELF;
  }

  Terminal(_command, _callback){
        const SELF = this;

        const MESSAGES = [];
        const EXECUTION = LIBRARIES.ChildProcess.exec(_command);

        if(SELF.Settings.Debug === true){
            SELF.Log("Command : " + _command);
        }

        EXECUTION.stdout.on("data", (_data) => {
            _data = _data.split("\n");
            for(let i = 0; i < _data.length; i++){
                if(_data[i].length > 0){
                    MESSAGES.push(_data[i]);
                }
            }
        });

        EXECUTION.stderr.on("data", (_data) => {
            _data = _data.split("\n");
            for(let i = 0; i < _data.length; i++){
                if(_data[i].length > 0){
                    MESSAGES.push(_data[i]);
                }
            }
        });

        EXECUTION.on("close", (_error_code) => {
            if(_callback !== undefined){
                _callback(_error_code, MESSAGES);
            }
        });
    }

  Recognize(_path, _callback){
    const SELF = this;

    const FILE = LIBRARIES.FS.readFileSync(_path);
    const AUDIO_BYTES = FILE.toString("base64");
    const REQUEST = {
      audio: {
        content: AUDIO_BYTES
      },
      config: {
        encoding: "LINEAR16",
        //sampleRateHertz: 16000,
        languageCode: SELF.Main.Settings.Language
      }
    };
    (async () => {
      const [response] = await SELF.Client.recognize(REQUEST);
      let transcription = response.results
          .map(result => result.alternatives[0].transcript)
          .join('\n');
      //if(transcription != ""){
        transcription = transcription.charAt(0).toUpperCase() + transcription.slice(1);
        if(_callback !== undefined){
          _callback(transcription);
        }
      //}
      LIBRARIES.FS.unlink(_path, function(){});
    })();
  }
}

module.exports = STTVosk;
