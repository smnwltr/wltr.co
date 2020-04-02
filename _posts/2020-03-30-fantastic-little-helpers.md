---
title: Fantastic little helpers to make your life as developer easier

---
Note: This post will be continuously updated with more content.

## HORIZONTAL SCROLLBAR DAMMIT

Ever had a horizontal scrollbar and couldn't figure out which element was the culprit? Fire up dev tools, head to the console, then enter the following:

```javascript
var docWidth = document.documentElement.offsetWidth;

[].forEach.call(
  document.querySelectorAll('*'),
  function(el) {
    if (el.offsetWidth > docWidth) {
      console.log(el);
    }
  }
);
```

If you are lucky, there is actually an element that is wider than the document's width. If so, the console should put out the element at fault which you can then inspect right in the console to identify it. Thanks to [https://css-tricks.com/findingfixing-unintended-body-overflow/](this post by CSS Tricks) that saved my night.