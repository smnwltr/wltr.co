---
title: Custom HTML Video Controls
tags: [HTML, CSS, JavaScript]
---


## HTML

```html
<div class="flex-container mt-nav video-container">
    <video autoplay muted playsinline preload class="bp-video lazy"
        poster="{{'/assets/video/boilerplate.jpg'}}?{{cache_buster}}">
        <source src="{{'/assets/video/boilerplate.webm'}}?{{cache_buster}}" type="video/webm">
        <source src="{{'/assets/video/boilerplate.mp4'}}?{{cache_buster}}" type="video/mp4">
    </video>
    <div class="controls">
        <div class="orange-bar">
            <div class="orange-juice"> </div>
        </div>
        <div class="buttons">
            <button id="play-pause"></button>
            <button id="mute-unmute"></button>
        </div>
    </div>
</div>
```


## CSS

```css
.video-container {
  position: relative;
  overflow: hidden;
  
  &:hover .controls {
    transform: translateY(0);
  }
}

.bp-video {
  width: 100%;
  height: auto;
}

.controls {
  display: flex;
  position: absolute;
  bottom: 0;
  width: 100%;
  flex-wrap: wrap;
  background: rgba(0,0,0,0.7);
  transform: translateY(100%) translateY(-5px);
  transition: all .2s;
}

.buttons {
  paddinng: 10px;
}

.buttons button {
  background: none;
  border: 0;
  outline: 0;
  cursor: pointer;
}

.buttons button:before{
  font-family: 'Font Awesome 5 Free';
  width: 30px;
  height: 30px;
  display: inline-block;
  font-size: 28px;
  color: #fff;
  -webkit-font-smoothing: antialiased;
}

#play-pause:before {
  content: '\f28b';
}

#mute-unmute:before {
  content: '\f028';
}

.buttons button.play:before {
  content: '\f144'
}

.buttons button.pause:before {
  content: '\f28b'
}

.buttons button.mute:before {
  content: '\f028'
}

.buttons button.unmute:before {
  content: '\f028'
}

.orange-bar {
  height: 10px;
  top: 0;
  left: 0;
  width: 100%;
}

.orange-juice {
  height: 10px;
  background-color: orangered;
  transition: width .3s linear;
}
```

## JavaScript

```js
// video custom controls


var video = document.querySelector('.bp-video');
var juice = document.querySelector('.orange-juice');
var btnPlay = document.getElementById('play-pause');
var btnMute = document.getElementById('mute-unmute')

// play pause function

function togglePlayPause() {
    if (video.paused) {
        btnPlay.className = 'pause'
        video.play();
    }
    else {
        btnPlay.className = 'play';
        video.pause();
    }
}
btnPlay.onclick = function () {
    togglePlayPause();
}

// mute unmute function

function toggleMuteUnmute() {
    video.muted = !video.muted;
}

btnMute.onclick = function () {
    toggleMuteUnmute();
}

video.addEventListener('timeupdate', function () {
    var juicePos = video.currentTime / video.duration;
    juice.style.width = juicePos * 100 + '%';
})

```


