---
title: Add some eye candy to your app's homepage
tags: [HTML, CSS]
---

## Context
In previous posts, I described how to set up a Django App, how to include static files in it, and also how to make things easier (and better) by using Sass as a CSS preprocessor. In this post, I will describe a couple of quick and easy design tricks that will spice up the landing page of your app project. While the code below will use Sass and some basic JavaScript (jQuery), most of this can be achieved by using Bootstrap and simple CSS as well.

The goal is to create a feature list below the header image on our front page. The list is to  describe our app's most important features, and the final result should look similar to this:

<img width="50%" src="{{'/assets/img/posts/landingpage.png'}}" class="img-fluid" alt="Landing Page Screenshot">

## Browser frames for screen shots

Looking for a pure CSS solution to add browser frames to screenshots, I came across this [excellent CodePen by Emily Cutler](https://codepen.io/ecutler/pen/dMQNgR) which does just that. It is close to the Chrome look, and adds not only the browser control buttons, but also navigation buttons, the URL bar, full screen and refresh buttons. I used it as a starting point and modified it slightly:

Since I wanted my browser frame to accentuate the screenshot without distracting visitors, I removed all buttons except for browser control and the URL bar. Also, to make sure it does not interfere with any other CSS classes (e.g. the Bootstrap `.close` class), I prepended all but the outermost wrapper class with *bf* (for *browser frame*).

```scss
.browser-frame {
  border-radius: $border-radius-large;
  box-shadow: 0 0 3px $browser-chrome;
  overflow: hidden;
  max-width: 600px;

  img {
    max-width: 100%;
  }
}

.bf-browser-controls {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: space-around;
  background: $browser-chrome;
  color: $browser-controls;
}

.bf-window-controls {
  flex: 0 0 60px;
  margin: 0 2%;

  span {
    display: inline-block;
    width: 15px;
    height: 15px;
    border-radius: 50px;
    background: $close;

    &.bf-minimise {
      background: $minimise;
    }

    &.bf-maximise {
      background: $maximise;
    }
  }
}

.bf-url-bar {
  flex-grow: 1;
  margin-right: 2%;
  padding: 5px 5px 0 10px;
  font-family: monospace;
  color: darken($browser-controls, 20%);
  overflow: hidden;
}

.bf-white-container {
  height: $control-height;
  border-radius: $border-radius-small;
  background: white;
}
```



Next, I added a bit more box shadow to the parent element to make it stand out a bit clearer from the rest of the page. 

```scss
.browser-frame {
  border-radius: $border-radius-large;
  box-shadow: 1px 5px 3px rgba(black, 0.25);
  overflow: hidden;
  max-width: 600px;

  img {
    max-width: 100%;
  }
}
```


Finally, I wanted to make it easy to usee, also in the future if I wanted to use it in more places across the site. So I created a class I added to all `img` elements I wanted to have the frame, and then I add the remainder of the HTML with one line of jQuery:

```html
<img src="https://via.placeholder.com/600x400" alt="{{app_name}}" class="browser-frame-it img-fluid"/>
```
Note here the use of [https://placeholder.com](https://placeholder.com), a pretty neat service for placeholder images. Simply add the dimensions at the end of the URL and it will serve a respectively sized placeholder image.


```js
$(document).ready(function () {
    $(".browser-frame-it").wrap("<div class='browser-frame'></div>").parent().prepend("<div class='bf-browser-controls'><div class='bf-window-controls'><span class='bf-close'></span> <span class='bf-minimise'></span> <span class='bf-maximise'></span></div><span class='bf-url-bar bf-white-container'>https://www.magellan.com/</span></div>");
})
```
If you are not familiar or comfortable yet with JavaScript and/or jQuery, you can totally follow the initial example on CodePen. However, this is a great little script to understand what jQuery does.

The first line basically tells the browsre to wait until the page loaded (*document is ready*), and then executes the function inside the curly braces. 

Now inside that function, jQuery executes four tasks:

1. Select the element with class `browser-frame-it`.
2. Wrap that element inside a new div with class `browser-frame`.
3. Go up to the parent. Remember, we still have the `browser-frame-it` element selected, and hence need to jump one level up to `browser-frame`.
4. Prepend a whole bunch of elements to the `browser-frame` element. This will add all the HTML we need to create the browser frame elements.

Normally, I refrain from using jQuery/JavaScript when possible, since I like super fast apps and executing scripts always adds a couple of milliseconds to load time. In this case, I do like using it though so we don't have to repeat HTML code over and over. 


## Text-marker highlighting

This is a quick one: I like adding a text marker effect on headings to draw more attention to them. All you need to do is wrap the text you want to highlight in a `span` element with the respective class. Then, add three attributes to that class and you are done. 

```html
<span class="highlighter">Packlist</span>
```

```scss
.highlighter {
  background: linear-gradient(to bottom, transparent 65%, rgba($magellan-yellow, 0.75) 0) center center/10% 75% no-repeat;
  background-size: 100% 100%;
  padding: .5rem 1rem;
}
```

Change the look of the highlight by adjusting the:
* color (third argument of the linear gradient)
* horizontal overlap by adding horizontal padding
* vertical distance by adding bottom padding and the percentage of the scond argument of the linear gradient


## Bootstrap Bonus: Column ordering

As you can see in the screenshot above, I alternate the order of the columns within each feature row. The first row has the browser frame first, the second row has the text box first. Both elements (browser frame and text box) each rest inside a `col-md` div. Now, when you shrink the window, or use a phone or tablet, Bootstrap will break the grid down to a one column grid on *xs* or *sm* viewports. When that happens, we want to make sure that now the ordering of the columns is always the same, meaning we want either the browser frame on top or the text box. Alternating from top to bottom would be confusing for visitors. To achieve this, we make use of Bootstrap's `order` helper classes. We order the columns in our code the way we want them to appear in the smallest viewports (usually *xs* or *sm*), and then add the `order` classes with a breakpoint identifier to reorder them on (in our case) *md* screens by appending lower keys to the class we want to appear first in a row. Like this:

```html
<div class="container feature-section">
    <div class="row">
        <div class="col-md order-md-12">
            <h2 class="display-4"><span class="highlighter">Packlist</span></h2>
            <p>Packlist subline</p>
            <p class="lead"><a href="#" class="btn btn-primary mt-2 btn-cta">Pack Now</a></p>
        </div>

        <div class="col-md order-md-0">
            <img src="https://via.placeholder.com/600x400" alt="{{app_name}}" class="browser-frame-it img-fluid"/>
        </div>
    </div>
</div>
```
