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

    SELF.RootPath = LIBRARIES.Path.join(_main.DirName, "lib", "skills", "522704580", "src");

    SELF.CheckPythonVersion(_main, function(){
      SELF.CheckPIPVersion(_main, function(){
        SELF.CheckVoskInstalled(_main, function(){
          _main.Log("STT-Vosk : Everything is operational.", "green");
          SELF.Main.STT = SELF;
        });
      });
    });

    SELF.Main.STT = SELF;
  }

  SpeechTotext(_wavPath, _callback){
    this.Terminal("python3 " + LIBRARIES.Path.join(this.RootPath, "wav.py") + " "+ _wavPath, function (_error_code, _messages) {
      const SPLITTER = "\"text\" : ";
      for(let i = 0; i < _messages.length; i++){
        if(_messages[i].includes(SPLITTER)){
          _callback(_messages[i].split(SPLITTER)[1].slice(1,-1));
          break;
        }
      }
    });
  }

  CheckPythonVersion(_main, _callback){
    this.Terminal("python3 --version", function (_error_code, _messages) {
        if (_error_code === 0) {
            const VERSION = _messages[0].slice("Python ".length).split(".");
            if(VERSION[0] == "3" && (parseInt(VERSION[1]) >= 5 && parseInt(VERSION[1]) <= 9)){
              _callback();
            }
            else{
              _main.Log("STT-Vosk : Your python version must be between \"3.5\" and \"3.9\".", "red");
            }
        } else {
          _main.Log("STT-Vosk : An error occurred while checking the version of python.", "red");
        }
    });
  }

  CheckPIPVersion(_main, _callback){
    this.Terminal("pip3 --version", function (_error_code, _messages) {
        if (_error_code === 0) {
            for(let i = 0; i < _messages.length; i++){
              if(_messages[i].startsWith("pip ")){
                const VERSION = _messages[i].slice("pip ".length).split(" from ")[0].split(".");
                const NUMERIC_VERSION = parseInt(VERSION[0]) + parseInt(VERSION[1]) * 0.1;
                if(NUMERIC_VERSION >= 20.3){
                  _callback();
                }
                else{
                  _main.Log("STT-Vosk : Your pip version must be \"20.3\" and newer.", "red");
                }
              }
            }
        } else {
          _main.Log("STT-Vosk : An error occurred while checking the version of pip.", "red");
        }
    });
  }

  CheckVoskInstalled(_main, _callback){
    const SELF = this;
    SELF.Terminal("pip3 list", function (_error_code, _messages) {
        if (_error_code === 0) {
            let installed = false;
            for(let i = 0; i < _messages.length; i++){
                 const PACKAGE = _messages[i].split(" ").filter(n => n);
                 if(PACKAGE[0] == "vosk"){
                   installed = true;
                   break;
                 }
            }
            if(!installed){
              SELF.Terminal("pip3 -v install vosk", function (_error_code, _messages) {
                  if (_error_code === 0) {
                    _main.Log("STT-Vosk : Model download. This may take a few minutes.", "red");
                    SELF.SpeechTotext(LIBRARIES.Path.join(SELF.RootPath, "empty.wav"), function(_message){
                      _main.Log("STT-Vosk : Model is downloaded.", "green");
                    });
                  } else {
                    _main.Log("STT-Vosk : An error occurred while installing Vosk.", "red");
                  }
              });
            }
            else{
              _callback();
            }
        } else {
          _main.Log("STT-Vosk : An error occurred while checking the version of Vosk.", "red");
        }
    });
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
    console.log(_path);
    SELF.SpeechTotext(_path, function(_message){
      _message = _message.charAt(0).toUpperCase() + _message.slice(1);
      console.log(_message);
      _callback(_message);
    });
  }
}

module.exports = STTVosk;
