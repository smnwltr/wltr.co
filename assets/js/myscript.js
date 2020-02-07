
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

// strip links from post previews

$(document).ready(function () {
    $('.fadeout').find('a').contents().unwrap();
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
