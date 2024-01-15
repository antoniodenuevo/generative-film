/*
Createdy by:
ANTONIO MARTINEZ

DESCRIPTION OF THE PROGRAM
This is a non-interactive piece that plays videos and sounds in a non-linear way.
Besides this sketch file there are 2 json files: data.json and narration.json.

Data.json contains an array of 6 sequences. Each sequence contains
 - list of videos
 - a soundtrack audio file
 - length of the sequence as number of clips
 - length of each clip
 - next sequence that will follow

Narration.json contains a number of audio files that work as the narration of the story.

The program will pick a random sequence from the array of sequences,
will play as many clips as the sequence requires and will move then to the next sequence.
There are more videos per sequence than needed, allowing for a bigger variation of visuals.

Note that in order to fit the file under 100mb the videos have been heavily compressed.
As you can see there are barely any references. This is because I haven't found a lot of documentation
that was helpful to work with videos. I encountered many issues in the loading, syncing of videos
that I solved myself by doing extensive debugging and trying different approaches.
The performance of code is smooth, but I am aware that perhaps some code is redundant.

INSTRUCTIONS
Just go live, there's no user interaction required :)
*/

//----------------------------------------------------------------------------
// PROGRAM VARIABLES

// video playback variables
let jsonData;
let myVideosArray = []; // array to store the videos
let currentVideo; // store the currently displayed image (video)
let timer = 0; // keep track of the last update time
let currentSequenceIndex = 0; // New variable to track the current sequence index
let videoPlayCount = 0; // Tracks how many videos have been played in the current sequence

// these are for the soundtrack
let song;
let soundPlaying = false; // to check if sound is playing
let originalVolume = 1.0;  // Adjust as needed for your desired volume level

// these are for the narration
let narrationAudio;
let audioTimer = 0;
let nextAudioPlayTime = 0;
let narrationData;


//----------------------------------------------------------------------------
// PROGRAM FUNCTIONS

//----------------------------------------------------------------------------
// Preload function
function preload() {
  // loads sequence data and narration data from json files
  jsonData = loadJSON('data.json', jsonLoaded);
  narrationData = loadJSON('narration.json');
}


//----------------------------------------------------------------------------
// Setup function
function setup() {
  createCanvas(windowWidth, windowHeight);
  narrationAudio = new p5.SoundFile();  // initialize to an empty SoundFile
}


//----------------------------------------------------------------------------
// Draw function
function draw() {
  background(0);
  videoSequence(); // main function that handles the logic of the video playback
  fadeOut() // fades out the soundtrack audio file for each sequence

  // this condition sets timer for audio narration track and plays a narration file
  if (narrationAudio && millis() - audioTimer > nextAudioPlayTime) {
    if (!narrationAudio.isPlaying()) {
      playRandomNarration();
      resetAudioTimer();
    }
  }
}


//----------------------------------------------------------------------------
// Reset audio timer function
function resetAudioTimer() {
  audioTimer = millis();
  nextAudioPlayTime = random(4000, 8000); // random time between 4 and 8 seconds. this is the time between narration clips
}


//----------------------------------------------------------------------------
// Json callback function
// This function is called after json data is loaded
function jsonLoaded() {
  // Loads a random sequence at the start of the program only
  selectAndLoadRandomSequence();
}


//----------------------------------------------------------------------------
// Next sequence function
/*
This function returns the index of a sequence, which will be played next.
As mentioned at the top of the program, each sequence includes a nextSequence which includes an index number.

The reason why I did this originally was because I wasn't sure if I wanted the sequence to be played in a
specific order this allows me to change my mind later. I also played for a while for sequences to play
in a non-linear way, but I prefer having control over the order of the sequences, to create a clearer narration
*/
function findSequenceIndexByName(name) {
  // finds index of a sequence with the given name
  return jsonData.sequences.findIndex(seq => seq.name === name);
}


//----------------------------------------------------------------------------
// Select And Load Random Function
/*
Selects and loads a sequence based on the given index from the sequences array.
*/
function selectAndLoadRandomSequence(sequenceIndex) {
  if (typeof sequenceIndex === 'undefined') {
    // Loads a random sequence if no specific index is provided
    sequenceIndex = floor(random(jsonData.sequences.length));
  } else {
  }

  // Set current sequence and load it
  currentSequenceIndex = sequenceIndex;
  loadSequence(jsonData.sequences[currentSequenceIndex]);
}


//----------------------------------------------------------------------------
// Load Sequence Function
// Loads a specific sequence and its associated videos.
function loadSequence(sequence) {
  myVideosArray = []; // reset the video array

  // Loading videos for the sequence
  for (let i = 0; i < sequence.videos.length; i++) {
    let vid = createVideo(sequence.videos[i].video, videoLoaded);
    vid.hide();
    myVideosArray.push(vid); // Add to array, so this pushes all videos of that sequence array to the myVideosArray
  }

  videoPlayCount = 0;
  timer = millis(); // Reset timer for the new sequence
  // I defined in my json file different lengths for each sequences, so that they are more dynamic. This allows to create different intensities for each sequence

  // Load the soundtrack for the sequence
  if (song) {
    song.stop(); // Stop previous song if any
    song = null;
  }
  song = loadSound(sequence.soundtrack, songLoaded); // Load new song
  song.setVolume(0.4);  // Lower the volume of song, to balance it with the narration. Make sure it's also the same value on fadeout function
}


//----------------------------------------------------------------------------
// Song Loaded Function
// I didn't specifically use any code from this tutorial,
// but it helped me setting up my sound files: 
// https://www.youtube.com/watch?v=o0toEEP3_y0&list=PLIsdHp2z9wFmOg2HNwD-GAQXbucWJ50aK
function songLoaded() {
  song.loop();
  soundPlaying = true;
  song.setVolume(0.4);  // Lower the volume of song
}


//----------------------------------------------------------------------------
// Video Loaded Callback Function
// Called when a video is loaded.
function videoLoaded() {
}

//----------------------------------------------------------------------------
// Select and Load Next Sequence Function
// This function will be called when a sequence finishes, and will load the next sequence based on the numeric index (nextSequence)
function selectAndLoadNextSequence() {
  let sequence = jsonData.sequences[currentSequenceIndex];
  let nextSequenceIndex = sequence.nextSequence;

  if (nextSequenceIndex !== undefined && nextSequenceIndex < jsonData.sequences.length) {
    selectAndLoadRandomSequence(nextSequenceIndex);
  }
}



//----------------------------------------------------------------------------
// Video Sequence Function
// This is probably the main function of the program. This was the starting point of the project and where everything grew from.
// videoSequence function picks a random video from our array that we filled, and plays, choosing a new one every number seconds (displayDuration).
function videoSequence() {
  let sequence = jsonData.sequences[currentSequenceIndex];

  // Immediately play a random video if it's the start of the sequence
  if (videoPlayCount === 0) {

    let randomIndex = floor(random(myVideosArray.length));

    currentVideo = myVideosArray[randomIndex];
    currentVideo.play();
    currentVideo.volume(0);
    videoPlayCount++; // Increment after playing the first video
    timer = millis(); // Reset the timer after playing the first video
  }
  // For subsequent videos, follow the normal timing logic
  else if (millis() - timer > sequence.displayDuration) {
    timer = millis();
    videoPlayCount++;

    // Load next sequence if all videos in the current sequence are played (numberOfVideos)
    if (videoPlayCount > sequence.numberOfVideos) {
      videoPlayCount = 1; // Reset for the next sequence
      selectAndLoadNextSequence(); // Call the function to load the next sequence
      return;
    }

    // Stop current and play next video
    if (currentVideo) {
      currentVideo.stop();
    }
    let randomIndex = floor(random(myVideosArray.length));
    currentVideo = myVideosArray[randomIndex];
    currentVideo.play();
    currentVideo.volume(0);

    // Remove the played video from the array
    // Found this approach via this video: https://www.youtube.com/watch?v=HXOD_XDA-KU
    myVideosArray.splice(randomIndex, 1); // Remove played video from the array. I did this so that clips don't play twice
  }

  // Display the current video
  // Once I compressed the videos in order to fit them in a 100mb folder,
  // I had some issues with the metadata, not allowing the program to recognise the aspect ratio.
  // That's why I created this rather long way of displaying them. With my current set of videos only image(currentVideo,0,0,width,0) was required.
  if (currentVideo) {
    let desiredWidth = width;
    let calculatedHeight = (currentVideo.height / currentVideo.width) * desiredWidth;
    image(currentVideo, 0, 0, desiredWidth, calculatedHeight);
  }
}


//----------------------------------------------------------------------------
// Fade Out Function
// This function creates the logic for the fadeout song. 
// I subtracted already in the json file 1000ms for sequence.songlength to make it easier,
// so if you look at it songlength is shorter than the sequence.
function fadeOut() {
  if (song.isPlaying()) {
    let playbackTime = song.currentTime();
    let sequence = jsonData.sequences[currentSequenceIndex];
    let fadeOutStart = sequence.songlength;
    let fadeOutEnd = fadeOutStart + 0.8; // for a 0.8 fade-out duration

    // Fade out logic
    if (playbackTime >= fadeOutStart && playbackTime <= fadeOutEnd) {
      let newVolume = map(playbackTime, fadeOutStart, fadeOutEnd, 0.4, 0);
      song.setVolume(newVolume);
    }
  }
}


//----------------------------------------------------------------------------
// Get Random Narration Clip function
// This function returns a random narration clip from the narration.json file
function getRandomNarrationClip() {
  let clips = narrationData.clips;
  let randomIndexNarration = floor(random(clips.length));
  return clips[randomIndexNarration].audio;
}


//----------------------------------------------------------------------------
// Play Random Narration Function
// This function plays narration audio clips
function playRandomNarration() {
  let clipPath = getRandomNarrationClip();
  narrationAudio = loadSound(clipPath, () => {
    narrationAudio.play();
    narrationAudio.onended(resetAudioTimer); // Reset timer after narration ends
  });
}


