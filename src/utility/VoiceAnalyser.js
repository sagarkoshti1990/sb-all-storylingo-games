import React, { useState, useEffect } from "react";
import v1 from "../assets/audio/V1.m4a";
import v2 from "../assets/audio/V2.m4a";
import v3 from "../assets/audio/V3.m4a";
import v4 from "../assets/audio/V4.m4a";
import v5 from "../assets/audio/V5.m4a";
import v6 from "../assets/audio/V6.m4a";
import v7 from "../assets/audio/V7.m4a";
import v8 from "../assets/audio/V8.m4a";
import AudioCompare from "./AudioCompare";
import Loader from "./Loader";
/* eslint-disable */

const AudioPath = {
  0: v1,
  1: v2,
  2: v3,
  3: v4,
  4: v5,
  5: v6,
  6: v7,
  7: v8,
};
function VoiceAnalyser(props) {
  const [loadCnt, setLoadCnt] = useState(0);
  const [loader, setLoader] = useState(false);
  const [pauseAudio, setPauseAudio] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState("");
  const [recordedAudioBase64, setRecordedAudioBase64] = useState("");
  const [audioPermission, setAudioPermission] = useState(null);
  const [ai4bharat, setAi4bharat] = useState("");
  const [temp_audio, set_temp_audio] = useState(null);
  const playAudio = (val) => {
    set_temp_audio(new Audio(AudioPath[props.storyLine]));
    setPauseAudio(val);
  };

  useEffect(() => {
    console.log("check temp audio", temp_audio && temp_audio.play());
    if (temp_audio !== null) {
      if (!pauseAudio) {
        temp_audio.pause();
        props.setVoiceAnimate(false);
      } else {
        temp_audio.play();
        props.setVoiceAnimate(true);
      }
      temp_audio.onended = function () {
        setPauseAudio(false);
        props.setVoiceAnimate(false);
      };
      //temp_audio.addEventListener("ended", () => alert("end"));
    }
    return () => {
      if (temp_audio !== null) {
        temp_audio.pause();
      }
    };
  }, [temp_audio]);

  useEffect(() => {
    if (loadCnt === 0) {
      getpermision();
      setLoadCnt((loadCnt) => Number(loadCnt + 1));
    }
  }, [loadCnt]);

  useEffect(() => {
    if (recordedAudio !== "") {
      setLoader(true);
      let uri = recordedAudio;
      var request = new XMLHttpRequest();
      request.open("GET", uri, true);
      request.responseType = "blob";
      request.onload = function () {
        var reader = new FileReader();
        reader.readAsDataURL(request.response);
        reader.onload = function (e) {
          console.log("DataURL:", e.target.result);
          var base64Data = e.target.result.split(",")[1];
          setRecordedAudioBase64(base64Data);
        };
      };
      request.send();
    } else {
      setLoader(false);
      setRecordedAudioBase64("");
      setAi4bharat("");
    }
  }, [recordedAudio]);

  useEffect(() => {
    if (recordedAudioBase64 !== "") {
      fetchASROutput("en", recordedAudioBase64);
    }
  }, [recordedAudioBase64]);
  useEffect(() => {
    // props.updateStory();
    props.setVoiceText(ai4bharat);
    props.setRecordedAudio(recordedAudio);
  }, [ai4bharat]);

  const fetchASROutput = (sourceLanguage, base64Data) => {
    let samplingrate = 30000;
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    var payload = JSON.stringify({
      config: {
        language: {
          sourceLanguage: sourceLanguage,
        },
        transcriptionFormat: {
          value: "transcript",
        },
        audioFormat: "wav",
        samplingRate: samplingrate,
        postProcessors: null,
      },
      audio: [
        {
          audioContent: base64Data,
        },
      ],
    });
    var requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: payload,
      redirect: "follow",
    };
    const apiURL = `https://asr-api.ai4bharat.org/asr/v1/recognize/en`;
    fetch(apiURL, requestOptions)
      .then((response) => response.text())
      .then((result) => {
        var apiResponse = JSON.parse(result);
        setAi4bharat(
          apiResponse["output"][0]["source"] != ""
            ? apiResponse["output"][0]["source"]
            : "-"
        );
        setLoader(false);
      });
  };

  // const getpermision = () => {
  //   navigator.getUserMedia =
  //     navigator.getUserMedia ||
  //     navigator.webkitGetUserMedia ||
  //     navigator.mozGetUserMedia ||
  //     navigator.msGetUserMedia;
  //   navigator.getUserMedia(
  //     { audio: true },
  //     () => {
  //       console.log("Permission Granted");
  //       setAudioPermission(true);
  //     },
  //     () => {
  //       console.log("Permission Denied");
  //       setAudioPermission(false);
  //       //alert("Microphone Permission Denied");
  //     }
  //   );
  // };
  const getpermision = () => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        console.log("Permission Granted");
        setAudioPermission(true);
      })
      .catch(error => {
        console.log("Permission Denied");
        setAudioPermission(false);
        //alert("Microphone Permission Denied");
      });
  };
  return (
    <div>
      {loader ? (
        <Loader />
      ) : (
        (() => {
          if (audioPermission != null) {
            if (audioPermission) {
              return (
                <AudioCompare
                  setRecordedAudio={setRecordedAudio}
                  playAudio={playAudio}
                  pauseAudio={pauseAudio}
                />
              );
            } else {
              return (
                <h5
                  style={{
                    position: "fixed",
                    bottom: "50px",
                    fontSize: "19px",
                    color: "red",
                    width: "100%",
                  }}
                >
                  Microphone Permission Denied
                </h5>
              );
            }
          }
        })()
      )}
    </div>
  );
}

export default VoiceAnalyser;
