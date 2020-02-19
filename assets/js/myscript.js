
// Hamburger menu toggling
window.onload = function () {
    // Look for .hamburger
    var hamburger = document.querySelector(".hamburger");
    var elementsArray = document.querySelectorAll(".nav-link");
    var collapsible = document.getElementById("navbarNav")
    // On click toggle class "is-active"
    hamburger.addEventListener("click", function () {
        hamburger.classList.toggle("is-active");
    });

    elementsArray.forEach(function (elem) {
        elem.addEventListener("click", function () {
            hamburger.classList.remove("is-active");
            collapsible.classList.remove("show");
        });
    });
}

// strip links from post previews, add target blank to blog post links (since not possible in markdown)

$(document).ready(function () {
    $('.blog-post.container').find('a').attr('target', '_blank').attr('rel', 'noopener noreferrer');
})

// smooth scrolling
$(document).ready(function () {
    $(".smooth-scroll").click(function (e) {
        e.preventDefault();

        var position = $($(this).attr("href")).offset().top;

        $("html, body").animate({
            scrollTop: position
        }, 1000);
    });

    $(window).scroll(function () {
        if ($(this).scrollTop() > 50) {
            $('.scrolltop:hidden').stop(true, true).fadeIn();
        } else {
            $('.scrolltop').stop(true, true).fadeOut();
        }
    });
    $(function () { $(".scroll").click(function () { $("html,body").animate({ scrollTop: 0 }, 1000); return false }) })

});


// Adjusting scroll to for anchor tags so they are not hidden by navbar, 
// thanks to https://stackoverflow.com/a/17535094/11159842

// The function actually applying the offset
function offsetAnchor() {
    if (location.hash.length !== 0) {
        window.scrollTo(window.scrollX, window.scrollY - 100);
    }
}

// Captures click events of all <a> elements with href starting with #
$(document).on('click', 'a[href^="#"]', function (event) {
    // Click events are captured before hashchanges. Timeout
    // causes offsetAnchor to be called after the page jump.
    window.setTimeout(function () {
        offsetAnchor();
    }, 0);
});

// Set the offset when entering page with hash present in the url
window.setTimeout(offsetAnchor, 0);