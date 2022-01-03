/*init function*/
jQuery(function () {
    initBgCover();
});

/*background cover*/
function initBgCover(context) {
    if (!context) context = jQuery('body');
    context.find('.bg-cover').each(function () {
        var holder = jQuery(this);
        var image = holder.find('> img').hide();
        var imageSrc = image.prop('src');
        holder.css({
            backgroundImage: 'url(' + imageSrc + ')'
        });
    });
}


jQuery(document).ready(function () {



    /** Sticky Header **/
    $(window).scroll(function () {
        if ($(this).scrollTop() > 10) {
            $('header').addClass("sticky");
        } else {
            $('header').removeClass("sticky");
        }
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

    //banner slider
    jQuery('.banner-slider').slick({
        dots: true,
        speed: 1500,
        infinite: true,
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 5000,
        arrows: false,
        adaptiveHeight: true
    }).slickAnimation();


    //trainer slider
    jQuery('.trainer-slider').slick({
        dots: true,
        speed: 1500,
        infinite: true,
        slidesToShow: 3,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 5000,
        arrows: false,
        adaptiveHeight: true,
        responsive: [{
                breakpoint: 992,
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: 1,
                }
            },
            {
                breakpoint: 768,
                settings: {
                    slidesToShow: 1,
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


    /* Testimonial slider  */

    $('.slider-for').slick({
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: false,
        fade: true,
        asNavFor: '.slider-nav'
    });
    $('.slider-nav').slick({
        slidesToShow: 3,
        slidesToScroll: 1,
        asNavFor: '.slider-for',
        dots: false,
        centerMode: true,
        centerPadding: '0',
        autoplay: true,
        focusOnSelect: true
    });

    $('.fancybox').fancybox();
    new WOW().init();

    /* Search Toggle */
    $('searh-form-wrap').hide();
    $(".search i").click(function () {
        $('.searh-form-wrap').fadeIn();
        $('body').toggleClass('fixed-layout');
    });

    $(".search-rom .close").click(function () {
        $('.searh-form-wrap').fadeOut();
        $('body').removeClass('fixed-layout');
    });



    //blog slider
    jQuery('.blog-slider').slick({
        dots: false,
        speed: 1500,
        infinite: true,
        slidesToShow: 3,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 5000,
        arrows: true,
        adaptiveHeight: true,
        responsive: [{
                breakpoint: 992,
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: 1,
                }
            },
            {
                breakpoint: 768,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1
                }
            }
        ]
    });

    //product slider
    jQuery('.top-rated-slider').slick({
        dots: false,
        speed: 1500,
        infinite: true,
        slidesToShow: 4,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 5000,
        arrows: true,
        adaptiveHeight: true,
        responsive: [{
                breakpoint: 992,
                settings: {
                    slidesToShow: 3,
                    slidesToScroll: 1,
                }
            },
            {
                breakpoint: 768,
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: 1
                }
            },
            {
                breakpoint: 576,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1
                }
            }
        ]
    });


    // For Vieo tab toggle

    jQuery('.shop-wrp .nav-tabs-dropdown').each(function (i, elm) {

        jQuery(elm).text(jQuery(elm).next('.shop-wrp ul').find('.shop-wrp li a.active').text());

    });

    jQuery('.shop-wrp .nav-tabs-dropdown').on('click', function (e) {

        e.preventDefault();

        jQuery(e.target).toggleClass('.shop-wrp open').next('.shop-wrp ul').slideToggle();

    });

    jQuery('#myTab a[data-toggle="tab"]').on('click', function (e) {

        e.preventDefault();

        jQuery(e.target).closest('.shop-wrp ul').hide().prev('.shop-wrp .nav-tabs-dropdown').removeClass('.shop-wrp open').text(jQuery(this).text());

    });


});