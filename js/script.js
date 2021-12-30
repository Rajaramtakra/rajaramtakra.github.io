jQuery(document).ready(function () {

    //banner typewritter
    var TxtType = function (el, toRotate, period) {
        this.toRotate = toRotate;
        this.el = el;
        this.loopNum = 0;
        this.period = parseInt(period, 10) || 2000;
        this.txt = '';
        this.tick();
        this.isDeleting = false;
    };

    TxtType.prototype.tick = function () {
        var i = this.loopNum % this.toRotate.length;
        var fullTxt = this.toRotate[i];

        if (this.isDeleting) {
            this.txt = fullTxt.substring(0, this.txt.length - 1);
        } else {
            this.txt = fullTxt.substring(0, this.txt.length + 1);
        }

        this.el.innerHTML = '<span class="wrap">' + this.txt + '</span>';

        var that = this;
        var delta = 200 - Math.random() * 100;

        if (this.isDeleting) {
            delta /= 2;
        }

        if (!this.isDeleting && this.txt === fullTxt) {
            delta = this.period;
            this.isDeleting = true;
        } else if (this.isDeleting && this.txt === '') {
            this.isDeleting = false;
            this.loopNum++;
            delta = 500;
        }

        setTimeout(function () {
            that.tick();
        }, delta);
    };

    window.onload = function () {
        var elements = document.getElementsByClassName('typewrite');
        for (var i = 0; i < elements.length; i++) {
            var toRotate = elements[i].getAttribute('data-type');
            var period = elements[i].getAttribute('data-period');
            if (toRotate) {
                new TxtType(elements[i], JSON.parse(toRotate), period);
            }
        }
        // INJECT CSS
        var css = document.createElement("style");
        css.type = "text/css";
        css.innerHTML = ".typewrite > .wrap { border-right: 0.08em solid #fff}";
        document.body.appendChild(css);
    };

    /** Sticky Header **/
    // $(window).scroll(function () {
    //     if ($(this).scrollTop() > 10) {
    //         $('header').addClass("sticky");
    //     } else {
    //         $('header').removeClass("sticky");
    //     }
    // });

    function animationHover(element, animation) {
        element = $(element);
        element.hover(
            function () {
                element.addClass('animated ' + animation);
            },
            function () {
                //wait for animation to finish before removing classes
                window.setTimeout(function () {
                    element.removeClass('animated ' + animation);
                }, 2000);
            });
    }

    $('.courses-block .img-wrap').each(function () {
        animationHover(this, 'swing');
    });



    var header_height = $(".header").height();
    $(".header_height").height(header_height);

    //scrollTo top function
    // hide #back-top first
    $(".scrollToTop").hide();

    // fade in #back-top
    $(function () {
        $(window).scroll(function () {
            if ($(this).scrollTop() > 100) {
                $('.scrollToTop').fadeIn();
            } else {
                $('.scrollToTop').fadeOut();
            }
        });

        // scroll body to 0px on click
        $('.scrollToTop').click(function () {
            $('body,html').animate({
                scrollTop: 0
            }, 800);
            return false;
        });
    });

    // For toggler menu 

    $("button.navbar-toggler").click(function () {
        $("button.navbar-toggler").toggleClass('expand');
    });

    //testimnial slider
    jQuery('.testimonial-slider').slick({
        dots: false,
        speed: 1500,
        infinite: true,
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 5000,
        arrows: true,
        adaptiveHeight: true
    });

    //brand slider
    jQuery('.brand-slider').slick({
        dots: false,
        speed: 1500,
        infinite: true,
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 5000,
        arrows: false,
        fade: true,
        adaptiveHeight: true
    });

    //affiliation slider
    jQuery('.parnters-slider').slick({
        dots: true,
        speed: 1500,
        infinite: true,
        slidesToShow: 5,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 5000,
        arrows: false,
        adaptiveHeight: true,
        responsive: [{
                breakpoint: 992,
                settings: {
                    slidesToShow: 4,
                    slidesToScroll: 1,
                }
            },
            {
                breakpoint: 768,
                settings: {
                    slidesToShow: 3,
                    slidesToScroll: 1
                }
            },
            {
                breakpoint: 576,
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: 1
                }
            }
        ]
    });

    $(".sidebar-item .emi-btn").click(function () {
        $(".emi-calculator").toggleClass('popup-toggle');
    });

    $(".sidebar-item .fa-close").click(function () {
        $(".emi-calculator").removeClass('popup-toggle');
    });

    // Message popup box
    $("#addClass").click(function () {
        $('#qnimate').addClass('popup-box-on');
    });

    $("#removeClass").click(function () {
        $('#qnimate').removeClass('popup-box-on');
    });



});