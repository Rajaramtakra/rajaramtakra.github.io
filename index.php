<?PHP
/*
    Contact Form from HTML Form Guide
    This program is free software published under the
    terms of the GNU Lesser General Public License.
    See this page for more info:
    http://www.html-form-guide.com/contact-form/creating-a-contact-form.html
*/
require_once("./inc/fgcontactform.php");
require_once("./inc/captcha-creator.php");

$formproc = new FGContactForm();
$captcha = new FGCaptchaCreator('scaptcha');

$formproc->EnableCaptcha($captcha);

//1. Add your email address here.
//You can add more than one receipients.
$formproc->AddRecipient('crisalnp@hotmail.com'); //<<---Put your email address here


//2. For better security. Get a random tring from this link: http://tinyurl.com/randstr
// and put it here
$formproc->SetFormRandomKey('CnRrspl1FyEylUj');


if(isset($_POST['submitted']))
{
   if($formproc->ProcessForm())
   {
        $formproc->RedirectToURL("thank-you.php");
   }
}

?>
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Rajweb Design / Home Page</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">


<link type="text/css" href="css/bootstrap.min.css" rel="stylesheet" />

<link type="text/css" href="contact.css" rel="stylesheet" />

<linK type="text/css" href="css/font-awesome.min.css" rel="stylesheet" />
<linK type="text/css" href="css/isotop.css" rel="stylesheet" />
<link type="text/css" href="js/fansy/jquery.fancybox.css" rel="stylesheet" />
<link rel="stylesheet" type="text/css" href="css/owl.carousel.css" />
<link rel="stylesheet" type="text/css" href="css/scrolling-nav.css" />
<link type="text/css" href="css/hover.css" rel="stylesheet">
<link type="text/css" href="css/style.css" rel="stylesheet">
<link type="text/css" href="css/responsive.css" rel="stylesheet">

<link rel="shortcut icon" href="images/fav-icon.png">
</head>

<body id="page-top" data-spy="scroll" data-target=".navbar-fixed-top">



<!-- Parallax1 Join Section start -->
    <header id="header" class="header clearfix">  
        <section id="parallax1">
            <div class="bg1">
                <div class="bg-mask">
                        
                    <div class="example">
                        <div id="main_object"></div>
                    </div>
                    <div class="top-navigation clearfix">
                        <div class="container">
                    <div class="row">
                        <div class="col-md-12">
                    <div class="logo">
                        <a class="navbar-brand page-scroll" href="#header"><h1><span class="r">r</span>w <span class="bl">rajwebdesign</span></h1></a>
                    </div>
                   
                        </div>
                        <div class="col-md-12">
                            <div class="navigation">
                                <div class="line1">
                                    <div class="item active">
                                        <div class="hex single">
                                            <div class="hex single inner">
                                                <div class="hex single inner2">
                                                <a class="page-scroll" href="#services"><i class="fa fa-home"></i><p>Services</p></a>
                                                </div>
                                            </div>
                                        </div>
                                   </div>
                                    <div class="item">                                        
                                        <div class="hex">
                                            <div class="hex inner">
                                                <div class="hex inner2">
                                                    <a href="#"><i class="fa fa-html5"></i><p>Html</p></a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="item hex3">
                                        <div class="hex">
                                            <div class="hex inner">
                                                <div class="hex inner2">
                                                    <a href="#"><i class="fa fa-paint-brush"></i><p>Photoshop</p></a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="item hex4">
                                        <div class="item1">
                                            <div class="hex single">
                                                <div class="hex single inner">
                                                    <div class="hex single inner2">
                                                        <a class="page-scroll" href="#portfolio"><i class="fa fa-folder-open"></i><p>Portfolio</p></a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="line2">
                                    <div class="item hex5">
                                        <div class="hex single">
                                            <div class="hex single inner">
                                                <div class="hex single inner2">
                                                    <a class="page-scroll" href="#about"><i class="fa fa-info-circle"></i><p>About</p></a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="item hex6">
                                        <div class="hex">
                                            <div class="hex inner">
                                                <div class="hex inner2">
                                                    <a href="#"><i class="fa fa-css3"></i><p>CSS3</p></a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="item hex7">
                                        <div class="item1">
                                        <div class="hex single">
                                            <div class="hex single inner">
                                                <div class="hex single inner2">
                                                    <a class="page-scroll" href="#contact"><i class="fa fa-mobile"></i><p>Contact</p></a>
                                                </div>
                                            </div>
                                        </div>
                                        </div>
                                    </div>
                                    <div class="item hex8">
                                        <div class="hex">
                                            <div class="hex inner">
                                                <div class="hex inner2">
                                                    <a href="#"><i class="fa fa-wordpress"></i><p>Wordpress</p></a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="item hex9">
                                        <div class="item1">
                                        <div class="hex single">
                                            <div class="hex single inner">
                                                <div class="hex single inner2">
                                                    <a class="page-scroll" href="#testimonials"><i class="fa  fa-comments"></i><p>Testimonials</p></a>
                                                </div>
                                            </div>
                                        </div>
                                        </div>
                                    </div>
                                    
                                </div>
                                <div class="line3">
                                    <div class="item hex10">
                                        <div class="hex">
                                            <div class="hex inner">
                                                <div class="hex inner2">
                                                    <a href="#"><i class="fa fa-dollar"></i><p>jquery</p></a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="item hex11">
                                        <div class="hex">
                                            <div class="hex inner">
                                                <div class="hex inner2">
                                                    <a rel="#"><i class="fa fa-code"></i><p>Dremwever</p></a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-12">
                                <div class="shape-ancer">
                                    <div class="shape"></div>
                                </div>
                            </div>
                        </div>
                        
                        
                    </div>
                </div>
                    </div>
                </div>
            </div>
        </section>
    </header>
<!-- Parallax1 Join Section end -->

<!-- Fixed scroll navigation start -->

    <div class="navigation-fixed">
        <nav class="navbar navbar-default navbar-fixed-top" role="navigation" data-spy="scroll" data-target=".navbar-fixed-top">
                <div class="container">
                    <div class="navbar-header page-scroll">
                        <div id="header" class="top">
                        <!--<div class="live-chat">
                            <a href="#">Live Chat</a>
                            <div class="chat-box">
                                <h1>Welcome To Chatbox</h1>
                            </div>
                        </div>-->
                    <a class="page-scroll" href="#header"><i class="fa fa-angle-up">Top</i></a>
                    </div>
                        <button type="button" class="navbar-toggle" data-toggle="collapse" data-target=".navbar-ex1-collapse">
                            <span class="sr-only">Toggle navigation</span>
                            <span class="icon-bar"></span>
                            <span class="icon-bar"></span>
                            <span class="icon-bar"></span>
                        </button>
                        <a class="navbar-brand page-scroll" href="#header"><h1><span class="r">r</span>w <span class="bl">rajwebdesign</span></h1></a>
                    </div>
        
                    <!-- Collect the nav links, forms, and other content for toggling -->
                    <div class="collapse navbar-right navbar-collapse navbar-ex1-collapse navigation-fixed">
                        <ul class="nav navbar-nav collapse navbar-collapse navbar-ex1-collapse">
                            <!-- Hidden li included to remove active class from about link when scrolled up past about section -->
                            <li class="hide">
                                <a class="page-scroll" href="#header">Home</a>
                            </li>
                            <li>
                                <a class="page-scroll" href="#services">Services</a>
                            </li>
                            <li>
                                <a class="page-scroll" href="#hier">Hier</a>
                            </li>
                            <li>
                                <a class="page-scroll" href="#about">About</a>
                            </li>
                            <li>
                                <a class="page-scroll" href="#skill">Skills</a>
                            </li>
                            <li>
                                <a class="page-scroll" href="#portfolio">Portfolio</a>
                            </li>
                            <li>
                                <a class="page-scroll" href="#testimonials">Testimonials</a>
                            </li>
                            <li>
                                <a class="page-scroll" href="#contact">Contact</a>
                            </li>
                        </ul>
                    </div>
                    <!-- /.navbar-collapse -->
                </div>
                <!-- /.container -->
            </nav>
    </div>

<!-- Fixed Navigation end -->
                        
<!-- Service sectioin start -->

    <section id="services" class="services clearfix">
        <div class="container">
            <div class="row">
                <h2>Services</h2>
                <div class="div-wrapper">
                    <div class="divider">&nbsp;</div>
                </div>
                <div class="col-md-3 col-sm-6">
                  <div class="ser-items">
                    <div class="hex single inner">
                      <div class="hex single inner2"> <a href="index.html"><i class="fa fa-mobile-phone"></i></a> </div>
                    </div>
                    <h3>Fully Responsive</h3>
                    <p> I create unique, clean sites that are easy to navigate. All my works comply with web standards, use the latest industry techniques especially HTMl5 and CSS3.</p>
                  </div>
                </div>
                <div class="col-md-3 col-sm-6">
                  <div class="ser-items">
                    <div class="hex single inner">
                      <div class="hex single inner2"> <a href="index.html"><i class="fa fa-code"></i></a> </div>
                    </div>
                    <h3>Clean HTML5 Code</h3>
                    <p> I create unique, clean sites that are easy to navigate. All my works comply with web standards, use the latest industry techniques especially HTMl5 and CSS3.</p>
                  </div>
                </div>
                <div class="col-md-3 col-sm-6">
                  <div class="ser-items">
                    <div class="hex single inner">
                      <div class="hex single inner2"> <a href="index.html"><i class="fa fa-rocket"></i></a> </div>
                    </div>
                    <h3>Compatibal</h3>
                    <p> I create unique, clean sites that are easy to navigate. All my works comply with web standards, use the latest industry techniques especially HTMl5 and CSS3.</p>
                  </div>
                </div>
                <div class="col-md-3 col-sm-6">
                  <div class="ser-items">
                    <div class="hex single inner">
                      <div class="hex single inner2"> <a href="index.html"><i class="fa  fa-laptop"></i></a> </div>
                    </div>
                    <h3>Modern CSS3 styles</h3>
                    <p> I create unique, clean sites that are easy to navigate. All my works comply with web standards, use the latest industry techniques especially HTMl5 and CSS3.</p>
                  </div>
                </div>
                <div class="col-md-12">
                    <div class="shape-ancer">
                        <div class="shape"></div>
                    </div>
                </div>
            </div>
        </div>
    </section>

<!-- Service sectioin start -->


<!-- Parallax1 Join Section start -->
<section id="hier" class="hier">
    <div class="container">
        <div class="row">
            <div class="col-md-12 hier-inner">
              <h1>Are You ready to hire me ?</h1>
              <p> Just click button and enjoy spring on your website !</p>
              <P class="freelance">I am always interested in new projects. <br>
                Hire Me Here</P>
              <ul>
                <li class="hireme-freelancer"><a href="https://www.freelancer.com/u/rajaram19.html"><span class="hire-logo"></span> <span class="hire-text">Hire Me</span></a></li>
                <li class="hireme-odesk"><a href="https://www.odesk.com/users/~010b90f9c16ec600ae "><span class="hire-logo"></span> <span class="hire-text">Hire Me</span></a></li>
              </ul>
            </div>
            <div class="col-md-12">
                <div class="shape-ancer">
                    <div class="shape"></div>
                </div>
            </div>
        </div>
    </div>
 </section>
        
<!-- Parallax1 Join Section end -->


<!-- Service sectioin start -->

    <section id="about" class="about clearfix">
        <div class="container">
            <div class="row">
                <h2>About</h2>
                <div class="div-wrapper">
                    <div class="divider">&nbsp;</div>
                </div>
                
              <h3>Rajwebdesigner From Nepal<br>
                <p>A fresh & Unique web designer</p>
              </h3>
              <img src="images/man.png" alt="#">
              <p class="col-md-10 col-md-offset-1">Hello, I'm <span>Raja Ram Takra</span> and I am a creative freelance web designer based in Bhaktapur, Nepal. I'm using the best tools and technologies to create effective and pleasant-on-the-eye catching designs.
                "Every nice creations start from imagination followed by dedication" </p>
                <div class="col-md-12">
                    <div class="shape-ancer">
                        <div class="shape"></div>
                    </div>
                </div>
            </div>
        </div>
    </section>

<!-- About sectioin start -->




<!-- Parallax2 Join Section start -->
<section id="skill">
    <div id="parallax3">
        <div class="bg3">
            <div class="bg-mask">
                <div class="skills clearfix">
                    <div class="container">
                        <div class="row">
                            <div class="col-md-12">
                                 <h2>My Skills</h2>
                                <div class="skillset">
                                    <div class="skillbar" data-percent="90%">
                                        <div class="title">HTML/CSS</div>
                                        <div class="count-bar style="width: 90%;">
                                            <div class="count"><span>90%</span></div>
                                        </div>
                                    </div>
                                    <div class="skillbar" data-percent="90%">
                                        <div class="title">Bootstrap</div>
                                        <div class="count-bar style="width: 90%;">
                                            <div class="count"><span>90%</span></div>
                                        </div>
                                    </div>
                                    <div class="skillbar" data-percent="65%">
                                        <div class="title">jQuery</div>
                                        <div class="count-bar style="width: 65%;">
                                            <div class="count"><span>65%</span></div>
                                        </div>
                                    </div>
                                    <div class="skillbar" data-percent="85%">
                                        <div class="title">Photoshop</div>
                                        <div class="count-bar style="width: 85%;">
                                            <div class="count"><span>85%</span></div>
                                        </div>
                                    </div>
                                    <div class="skillbar" data-percent="95%">
                                        <div class="title">English Language</div>
                                        <div class="count-bar style="width: 95%;">
                                            <div class="count"><span>95%</span></div>
                                        </div>
                                    </div>   
                                </div>
                                <div class="col-md-12">
                                    <div class="shape-ancer">
                                        <div class="shape"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>    
</section>
        
<!-- Parallax2 Join Section end -->


 <!-- portfolio Banner section start -->
 
  <section id="portfolio" class="portfolio-all clearfix">
        <div class="container clearfix">
          <div class="row">
            <div class="col-md-12 ser">
                <div class="banner clearfix">
                  <h2>Our Best Portfolio</h2>
                  <div class="div-wrapper">
                        <div class="divider">&nbsp;</div>
                    </div>
                  <h3>Raj Webdesigner From Nepal
                    <p>A fresh & Unique web designer</p>
                  </h3>
                  <div class="laptop-veiw"><img src="images/laptop.png" alt="laptop-veiw"></div>
                  <div id="myCarousel" class="carousel slide" data-ride="carousel"> 
                    <!-- Indicators -->
                    <ol class="carousel-indicators">
                      <li data-target="#myCarousel" data-slide-to="0" class="active"></li>
                      <li data-target="#myCarousel" data-slide-to="1"></li>
                      <li data-target="#myCarousel" data-slide-to="2"></li>
                      <li data-target="#myCarousel" data-slide-to="3"></li>
                    </ol>
                    <div class="carousel-inner">
                      <div class="item active"> <img src="images/example/slide1.jpg" alt="First slide">
                        <div class="container">
                          <div class="carousel-caption">
                            <h1>Example headline.</h1>
                            <p>Note: If you're viewing this page via a <code>file://</code> URL, the "next" and "previous" Glyphicon buttons on the left and right might not load/display properly due to web browser security rules.</p>
                            <p><a class="btn btn-lg btn-primary" href="#" role="button">Sign up today</a></p>
                          </div>
                        </div>
                      </div>
                      <div class="item"> <img src="images/example/slide2.jpg" alt="Second slide">
                        <div class="container">
                          <div class="carousel-caption">
                            <h1>Another example headline.</h1>
                            <p>Cras justo odio, dapibus ac facilisis in, egestas eget quam. Donec id elit non mi porta gravida at eget metus. Nullam id dolor id nibh ultricies vehicula ut id elit.</p>
                            <p><a class="btn btn-lg btn-primary" href="#" role="button">Learn more</a></p>
                          </div>
                        </div>
                      </div>
                      <div class="item"> <img src="images/example/slide3.jpg" alt="Third slide">
                        <div class="container">
                          <div class="carousel-caption">
                            <h1>One more for good measure.</h1>
                            <p>Cras justo odio, dapibus ac facilisis in, egestas eget quam. Donec id elit non mi porta gravida at eget metus. Nullam id dolor id nibh ultricies vehicula ut id elit.</p>
                            <p><a class="btn btn-lg btn-primary" href="#" role="button">Browse gallery</a></p>
                          </div>
                        </div>
                      </div>
                      <div class="item"> <img src="images/example/slide4.jpg" alt="fourth slide">
                        <div class="container">
                          <div class="carousel-caption">
                            <h1>One more for good measure.</h1>
                            <p>Cras justo odio, dapibus ac facilisis in, egestas eget quam. Donec id elit non mi porta gravida at eget metus. Nullam id dolor id nibh ultricies vehicula ut id elit.</p>
                            <p><a class="btn btn-lg btn-primary" href="#" role="button">Browse gallery</a></p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <a class="left carousel-control" href="#myCarousel" data-slide="prev"><span class="glyphicon glyphicon-chevron-left"></span></a> <a class="right carousel-control" href="#myCarousel" data-slide="next"><span class="glyphicon glyphicon-chevron-right"></span></a>
                    </div>
               </div>
               <div class="isotop-menu">

                   <button type="button" class="navbar-toggle isotop-toggle" data-toggle="collapse" data-target=".isotop-collapse">
                    <h3 class="sr-only">Toggle Isotop Menu</h3>
                    <span class="i-btn">
                        <span class="icon-bar"></span>
                        <span class="icon-bar"></span>
                        <span class="icon-bar"></span>
                    </span>
                  </button>
               <div id="filters" class="button-group isotop-collapse collapse">
                  <button class="button is-checked" data-filter="*">show all</button>
                  <button class="button" data-filter=".metal">Web Design</button>
                  <button class="button" data-filter=".transition">Logo Design</button>
                  <button class="button" data-filter=".alkali, .alkaline-earth">Photography</button>
                  <button class="button" data-filter=":not(.transition)">Others</button>
               </div>
               </div>
               <div class="isotope">
                  <div class="element-item transition metal " data-category="transition">
                    <div class="thumb-img-wrap portfolio-rotation">
                    <a class="fancybox" href="images/port1.jpg" data-fancybox-group="gallery" title="Zestcatering">
                        <img src="images/port1.jpg" alt="1">
                        <span class="bk-color"></span>
                        <i class="fa fa-search search-icon"></i>
                        <a class="link" href="http://zestcatering.com.au/" target="_blank"><i class="fa fa-link"></i></a>
                    </a>
                    </div>
                  </div>
                  <div class="element-item metalloid " data-category="metalloid">
                    <div class="thumb-img-wrap portfolio-rotation">
                        <a class="fancybox" href="images/port2.jpg" data-fancybox-group="gallery" title="Education1">
                            <img src="images/port2.jpg" alt="1">
                            <span class="bk-color"></span>
                            <i class="fa fa-search search-icon"></i>
                            <a class="link" href="http://www.premierservicecleaning.com/" target="_blank"><i class="fa fa-link"></i></a>
                        </a>
                    </div>
                  </div>
                  <div class="element-item post-transition metal " data-category="post-transition">
                    <div class="thumb-img-wrap portfolio-rotation">
                        <a class="fancybox" href="images/port3.jpg" data-fancybox-group="gallery" title="Primoclean">
                            <img src="images/port3.jpg" alt="1">
                            <span class="bk-color"></span>
                            <i class="fa fa-search search-icon"></i>
                            <a class="link" href="http://meshdirect.com.au/" target="_blank"><i class="fa fa-link"></i></a>
                        </a>
                    </div>
                  </div>
                  <div class="element-item post-transition metal " data-category="post-transition">
                    <div class="thumb-img-wrap thumbnail portfolio-rotation">
                        <a class="fancybox" href="images/port4.jpg" data-fancybox-group="gallery" title="Burger10">
                            <img src="images/port4.jpg" alt="1">
                            <span class="bk-color"></span>
                            <i class="fa fa-search search-icon"></i>
                            <a class="link" href="http://burger10.com.au/" target="_blank"><i class="fa fa-link"></i></a>
                        </a>
                    </div>
                  </div>
                  <div class="element-item transition metal " data-category="transition">
                    <div class="thumb-img-wrap portfolio-rotation">
                        <a class="fancybox" href="images/port5.jpg" data-fancybox-group="gallery" title="Ductdoctor">
                            <img src="images/port5.jpg" alt="1">
                            <span class="bk-color"></span>
                            <i class="fa fa-search search-icon"></i>
                            <a class="link" href="http://ductdoctor.ae/" target="_blank"><i class="fa fa-link"></i></a>
                        </a>
                    </div>
                  </div>
                  <div class="element-item alkali metal " data-category="alkali">
                    <div class="thumb-img-wrap thumbnail portfolio-rotation">
                        <a class="fancybox" href="images/port6.jpg" data-fancybox-group="gallery" title="Feeltheenergy">
                            <img src="images/port6.jpg" alt="1">
                            <span class="bk-color"></span>
                            <i class="fa fa-search search-icon"></i>
                            <a class="link" href="http://feeltheenergy.com.au/" target="_blank"><i class="fa fa-link"></i></a>
                        </a>
                    </div>
                  </div>
                  <div class="element-item alkali metal " data-category="alkali">
                    <div class="thumb-img-wrap thumbnail portfolio-rotation">
                        <a class="fancybox" href="images/port7.jpg" data-fancybox-group="gallery" title="Education6">
                            <img src="images/port7.jpg" alt="1">
                            <span class="bk-color"></span>
                            <i class="fa fa-search search-icon"></i>
                            <a class="link" href="http://rajaramtakra.com.np/" target="_blank"><i class="fa fa-link"></i></a>
                        </a>
                    </div>
                  </div>
                  <div class="element-item transition metal " data-category="transition">
                   <div class="thumb-img-wrap thumbnail portfolio-rotation">
                    <a class="fancybox" href="images/port8.jpg" data-fancybox-group="gallery" title="SEO">
                            <img src="images/port8.jpg" alt="1">
                            <span class="bk-color"></span>
                            <i class="fa fa-search search-icon"></i>
                            <a class="link" href="http://rajaramtakra.com.np/seo/" target="_blank"><i class="fa fa-link"></i></a>
                        </a>
                   </div>
                  </div>
                  <div class="element-item alkaline-earth metal " data-category="alkaline-earth">
                    <div class="thumb-img-wrap thumbnail portfolio-rotation">
                        <a class="fancybox" href="images/port1.jpg" data-fancybox-group="gallery" title="Education10">
                            <img src="images/port1.jpg" alt="1">
                            <span class="bk-color"></span>
                            <i class="fa fa-search search-icon"></i>
                            <a class="link" href="http://zestcatering.com.au/" target="_blank"><i class="fa fa-link"></i></a>
                        </a>
                    </div>
                  </div>
                  <div class="element-item transition metal " data-category="transition">
                    <div class="thumb-img-wrap thumbnail portfolio-rotation">
                        <a class="fancybox" href="images/port2.jpg" data-fancybox-group="gallery" title="Education11">
                            <img src="images/port2.jpg" alt="1">
                            <span class="bk-color"></span>
                            <i class="fa fa-search search-icon"></i>
                            <a class="link" href="http://www.premierservicecleaning.com/" target="_blank"><i class="fa fa-link"></i></a>
                        </a>
                    </div>
                  </div>
                  <div class="element-item post-transition metal " data-category="post-transition">
                    <div class="thumb-img-wrap thumbnail portfolio-rotation">
                        <a class="fancybox" href="images/port3.jpg" data-fancybox-group="gallery" title="Education12">
                            <img src="images/port3.jpg" alt="1">
                            <span class="bk-color"></span>
                            <i class="fa fa-search search-icon"></i>
                            <a class="link" href="http://meshdirect.com.au/" target="_blank"><i class="fa fa-link"></i></a>
                        </a>
                    </div>
                  </div>
                  <div class="element-item metalloid " data-category="metalloid">
                    <div class="thumb-img-wrap thumbnail portfolio-rotation">
                        <a class="fancybox" href="images/port4.jpg" data-fancybox-group="gallery" title="Education13">
                            <img src="images/port4.jpg" alt="1">
                            <span class="bk-color"></span>
                            <i class="fa fa-search search-icon"></i>
                            <a class="link" href="http://burger10.com.au/" target="_blank"><i class="fa fa-link"></i></a>
                        </a>
                    </div>
                  </div>
                  <div class="element-item transition metal " data-category="transition">
                    <div class="thumb-img-wrap thumbnail portfolio-rotation">
                        <a class="fancybox" href="images/port5.jpg" data-fancybox-group="gallery" title="Education14">
                            <img src="images/port5.jpg" alt="1">
                            <span class="bk-color"></span>
                            <i class="fa fa-search search-icon"></i>
                            <a class="link" href="http://ductdoctor.ae/" target="_blank"><i class="fa fa-link"></i></a>
                        </a>
                    </div>
                  </div>
                  <div class="element-item lanthanoid metal inner-transition " data-category="lanthanoid">
                    <div class="thumb-img-wrap thumbnail portfolio-rotation">
                        <a class="fancybox" href="images/port6.jpg" data-fancybox-group="gallery" title="Education15">
                            <img src="images/port6.jpg" alt="1">
                            <span class="bk-color"></span>
                            <i class="fa fa-search search-icon"></i>
                        </a>
                    </div>
                  </div>
                  <div class="element-item noble-gas nonmetal " data-category="noble-gas">
                    <div class="thumb-img-wrap thumbnail portfolio-rotation">
                    <a class="fancybox" href="images/port7.jpg" data-fancybox-group="gallery" title="Education16">
                            <img src="images/port7.jpg" alt="1">
                            <span class="bk-color"></span>
                            <i class="fa fa-search search-icon"></i>
                        </a>
                    </div>
                  </div>
                  <div class="element-item diatomic nonmetal " data-category="diatomic">
                   <div class="thumb-img-wrap thumbnail portfolio-rotation">
                    <a class="fancybox" href="images/port8.jpg" data-fancybox-group="gallery" title="Education17">
                            <img src="images/port8.jpg" alt="1">
                            <span class="bk-color"></span>
                            <i class="fa fa-search search-icon"></i>
                            <a class="link" href="http://feeltheenergy.com.au/" target="_blank"><i class="fa fa-link"></i></a>
                        </a>
                   </div>
                  </div>
                  <div class="element-item actinoid metal inner-transition " data-category="actinoid">
                    <div class="thumb-img-wrap thumbnail portfolio-rotation">
                        <a class="fancybox" href="images/port7.jpg" data-fancybox-group="gallery" title="Education18">
                            <img src="images/port7.jpg" alt="1">
                            <span class="bk-color"></span>
                            <i class="fa fa-search search-icon"></i>
                            <a class="link" href="http://rajaramtakra.com.np/" target="_blank"><i class="fa fa-link"></i></a>
                        </a>
                    </div>
                  </div>
                  <div class="element-item actinoid metal inner-transition " data-category="actinoid">
                    <div class="thumb-img-wrap thumbnail portfolio-rotation">
                        <a class="fancybox" href="images/port8.jpg" data-fancybox-group="gallery" title="Education19">
                            <img src="images/port8.jpg" alt="1">
                            <span class="bk-color"></span>
                            <i class="fa fa-search search-icon"></i>
                            <a class="link" href="http://rajaramtakra.com.np/seo/" target="_blank"><i class="fa fa-link"></i></a>
                        </a>
                    </div>
                  </div>
                </div>
               <div class="col-md-12">
                    <div class="shape-ancer">
                        <div class="shape"></div>
                    </div>
                </div>
            </div>
          </div>
        </div>
      <!-- Banner section end --> 
 </section>
  
  <!-- portfolio section end -->




<!-- Parallax4 Join Section start -->
    <section id="testimonials">
        <div id="parallax4">
            <div class="bg4">
                <div class="bg-mask">
                    <div class="container clearfix">
                        <div class="row">
                            <div class="contain animated fadeInDown wow" id="animated-example">
                                <h1>What Our Client Say About Us</h1>
                                <div id="owl-demo" class="owl-carousel owl-theme">
                                        <div class="item animation fadeInDown wow" id="animated-example">
                                            <div class="col-xs-12 col-sm-12 col-md-3">
                                                <div class="test-left">
                                                    <div class="test-img-wrap">
                                                        <img src="images/staff1.png" alt="1">
                                                    </div>
                                                    <strong>client1</strong>
                                                </div>
                                            </div>
                                            <div class="col-xs-12 col-sm-12 col-md-9">
                                            <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipisicing elit,consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.Lorem ipsum dolor sit amet.</p>
                                            </div>
                                            
                                        </div>
                                        <div class="item animation fadeInDown wow" id="animated-example">
                                            <div class="col-xs-12 col-sm-12 col-md-3">
                                                <div class="test-left">
                                                    <div class="test-img-wrap">
                                                        <img src="images/staff1.png" alt="1">
                                                    </div>
                                                    <strong>client1</strong>
                                                </div>
                                            </div>
                                            <div class="col-xs-12 col-sm-12 col-md-9">
                                            <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipisicing elit,consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.Lorem ipsum dolor sit amet.</p>
                                            </div>
                                            
                                        </div>
                                        <div class="item animation fadeInDown wow" id="animated-example">
                                            <div class="col-xs-12 col-sm-12 col-md-3">
                                                <div class="test-left">
                                                    <div class="test-img-wrap">
                                                        <img src="images/staff1.png" alt="1">
                                                    </div>
                                                    <strong>client1</strong>
                                                </div>
                                            </div>
                                            <div class="col-xs-12 col-sm-12 col-md-9">
                                            <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipisicing elit,consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.Lorem ipsum dolor sit amet.</p>
                                            </div>
                                            
                                        </div>
                                    </div>
                            </div>
                            <div class="col-md-12">
                        <div class="shape-ancer">
                            <div class="shape"></div>
                        </div>
                    </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
                
<!-- Parallax4 Join Section end -->


<section id="contact">
<!-- footer-top section start 
    ================================================== -->
 
    <div class="footer-top">
        <div class="container clearfix">
            <div class="row">
                <div class="col-md-12">
                    <h2>Contact</h2>
                    <div class="div-wrapper">
                        <div class="divider">&nbsp;</div>
                    </div>
                    <div class="fluid-wrapper">
                        <iframe src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d56535.918966732665!2d85.39548672186531!3d27.671093884951738!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2s!4v1406796064642" width="600" height="450" frameborder="0" style="border:0"></iframe>
                    </div>
                    <div class="col-md-6">
                        <div class="foot-contact">
                            <ul>
                                <li>
                                    <i class="fa fa-mobile"></i>
                                    <p>98-41-110019</p>
                                </li>
                                <li>
                                    <a href="#">
                                        <i class="fa fa-envelope"></i>
                                        <p>crisalnp@hotmail.com</p>
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div class="col-md-6 col">
                        <div class="foot-contact social social-roll">
                        
                           <!-- for share this btn --> 
                          
                            <span class='st_facebook_hcount' displayText='Facebook'></span>
                            <span class='st_twitter_hcount' displayText='Tweet'></span>
                            <span class='st_googleplus_hcount' displayText='Google +'></span>
                            <span class='st_email_hcount' displayText='Email'></span>
                            <span class='st_sharethis_hcount' displayText='ShareThis'></span>
                            
                            
                            <!-- AddThis Button BEGIN -->
                            <!--<div class="addthis_toolbox addthis_default_style ">
                            <a class="addthis_button_preferred_1"></a>
                            <a class="addthis_button_preferred_2"></a>
                            <a class="addthis_button_preferred_3"></a>
                            <a class="addthis_button_preferred_4"></a>
                            <a class="addthis_button_compact"></a>
                            <a class="addthis_counter addthis_bubble_style"></a>
                            </div>
                            <script type="text/javascript">var addthis_config = {"data_track_addressbar":true};</script>
                            <script type="text/javascript" src="//s7.addthis.com/js/300/addthis_widget.js#pubid=ra-537ee30d26765f82"></script>-->
                            <!-- AddThis Button END --> 
                            
                          <!-- share this end -->
                        </div>
                    </div>
                    <div class="col-md-12">
                    <div class="div-wrapper">
                        <div class="divider">&nbsp;</div>
                    </div>
                    </div>
                    <div class="col-md-12">
                        <div class="email">
                            <form id='contactus' action='<?php echo $formproc->GetSelfScript(); ?>' method='post' accept-charset='UTF-8'>
                            <fieldset >
                            <input type='hidden' name='submitted' id='submitted' value='1'/>
                            <input type='hidden' name='<?php echo $formproc->GetFormIDInputName(); ?>' value='<?php echo $formproc->GetFormIDInputValue(); ?>'/>
                            <input type='text'  class='spmhidip' name='<?php echo $formproc->GetSpamTrapInputName(); ?>' />

                            <div class='short_explanation'>* required fields</div>

                            <div><span class='error'><?php echo $formproc->GetErrorMessage(); ?></span></div>
                            <div class='col-md-6'>
                                <div class="form-group">
                                    <input type='text' name='name' id='name' class="form-control" placeholder="Enter Name*:" value='<?php echo $formproc->SafeDisplay('name') ?>' maxlength="50" />
                                    <span id='contactus_name_errorloc' class='error'></span>
                                </div>
                            </div>
                            <div class='col-md-6'>
                                <div class="form-group">
                                <input type='text' name='email' id='email' class="form-control" placeholder="Email Address*:" value='<?php echo $formproc->SafeDisplay('email') ?>' maxlength="50" />
                                <span id='contactus_email_errorloc' class='error'></span>
                                </div>
                            </div>
                            <!-- <div class='container'>
                                <label for='phone' >Phone Number:</label><br/>
                                <input type='text' name='phone' id='phone' value='<?php echo $formproc->SafeDisplay('phone') ?>' maxlength="15" /><br/>
                                <span id='contactus_phone_errorloc' class='error'></span>
                            </div> -->
                            <div class='col-md-10 col-md-offset-1'>
                                <div class="form-group">
                                    <span id='contactus_message_errorloc' class='error'></span>
                                    <textarea rows="5" name='message' id='message' class="form-control" placeholder="Message:"><?php echo $formproc->SafeDisplay('message') ?></textarea>
                                </div>
                            </div>
                            <div class='col-xs-10 col-xs-offset-1 col-sm-8 col-sm-offset-2 col-md-6 col-md-offset-3'>
                                <div class="row form-group">
                                    <div class="col-md-5 cap-img">
                                        <div><img alt='Captcha image' src='show-captcha.php?rand=1' id='scaptcha_img' /></div>
                                    </div>
                                    <div class="col-md-7 cap-input">
                                        <label for='scaptcha' >Enter the code above here:</label>
                                        <input type='text' name='scaptcha' id='scaptcha' maxlength="10" /><br/>
                                        <span id='contactus_scaptcha_errorloc' class='error'></span>
                                        <div class='short_explanation'>Can't read the image?
                                        <a href='javascript: refresh_captcha_img();'>Refresh <i class="fa fa-refresh"></i></a>.</div>
                                    </div>
                                </div>
                            </div>
                            <div class='col-md-12 clearfix'>
                                <button type='submit' name='Submit' value='Submit' class="btn btn-default">Submit <i class="fa fa-paper-plane"></i></button>
                            </div>
                            </fieldset>
                            </form>
                        </div>
                   </div>
                </div>
               <div class="col-md-12">
                <div class="shape-ancer">
                        <div class="shape"></div>
                    </div>
               </div>          
            </div>    
        </div>
    </div>
     <!-- footer Bottom Section start 
    ================================================== -->
    <section id="parallax5">
        <div class="bg5">
            <div class="bg-mask">
                <div class="footer-social-icons">
                    <div class="me">&nbsp;</div>
                    <div class="container clearfix">
                       <div class="row">
                            <div class="col-md-12">
                                <div class="logo">
                                    <a class="navbar-brand page-scroll" href="#header"><h1><span class="r">r</span>w <span class="bl">rajwebdesign</span></h1></a>
                                </div>
                                <div class="sicialise">
                                    <ul>
                                        <li class="tool-tip" data-toggle="tooltip" title="Be Friend In Facebook">
                                            <a href="https://facebook.com"><i class="fa fa-facebook"></i></a>
                                        </li>
                                        <li class="tool-tip" data-toggle="tooltip" title="Twitter">
                                            <a href="https://twitter.com"><i class="fa fa-twitter"></i></a>
                                        </li>
                                        <li class="tool-tip" data-toggle="tooltip" title="Google Plus">
                                            <a href="https://google-plus.com"><i class="fa fa-google-plus"></i></a>
                                        </li>
                                        <li class="tool-tip" data-toggle="tooltip" title="Flickr">
                                            <a href="https://flickr.com"><i class="fa fa-flickr"></i></a>
                                        </li>
                                        <li class="tool-tip" data-toggle="tooltip" title="Skype">
                                            <a href="https://skype.com"><i class="fa fa-skype"></i></a>
                                        </li>
                                        <li class="tool-tip" data-toggle="tooltip" title="YouTube">
                                            <a href="https://youtube.com"><i class="fa fa-youtube"></i></a>
                                        </li>
                                        <li class="tool-tip" data-toggle="tooltip" title="Like Facebook Page">
                                            <a href="https://facebook.com"><i class="fa fa-facebook"></i></a>
                                        </li>                               
                                    </ul>           
                                    <p> 2014 © Rajweb Design.com.np,All rights are reserved.Designed By Rajaram !</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

   <!-- footer Bottom Section end 
    ================================================== -->
</section>
   
   
<!-- footer-top section end
    ================================================== -->
    
    

<!-- Bootstrap core JavaScript
    ================================================== -->
    
    <!-- Placed at the end of the document so the pages load faster -->
    <script src="js/jquery.js"></script>
    <script type="text/javascript" src="js/bootstrap.min.js"></script>
    <script type="text/javascript" src="js/min.js"></script>

    <script type='text/javascript' src='js/gen_validatorv31.js'></script>
      <script type='text/javascript' src='js/fg_captcha_validator.js'></script>
    <script type='text/javascript'>
// <![CDATA[

    var frmvalidator  = new Validator("contactus");
    frmvalidator.EnableOnPageErrorDisplay();
    frmvalidator.EnableMsgsTogether();
    frmvalidator.addValidation("name","req","Please provide your name");

    frmvalidator.addValidation("email","req","Please provide your email address");

    frmvalidator.addValidation("email","email","Please provide a valid email address");

    frmvalidator.addValidation("message","maxlen=2048","The message is too long!(more than 2KB!)");


    frmvalidator.addValidation("scaptcha","req","Please enter the code in the image above");

    document.forms['contactus'].scaptcha.validator
      = new FG_CaptchaValidator(document.forms['contactus'].scaptcha,
                    document.images['scaptcha_img']);

    function SCaptcha_Validate()
    {
        return document.forms['contactus'].scaptcha.validator.validate();
    }

    frmvalidator.setAddnlValidationFunction("SCaptcha_Validate");

    function refresh_captcha_img()
    {
        var img = document.images['scaptcha_img'];
        img.src = img.src.substring(0,img.src.lastIndexOf("?")) + "?rand="+Math.random()*1000;
    }

// ]]>
</script>
    
    <!-- Share this start --> 
<script type="text/javascript">var switchTo5x=true;</script> 
<script type="text/javascript" src="http://w.sharethis.com/button/buttons.js"></script> 
<script type="text/javascript">stLight.options({publisher: "d33da97a-9ba6-4f0b-8883-7107ca859f5d", doNotHash: false, doNotCopy: false, hashAddressBar: false});</script> 

<!-- Share this end --> 

    
     <!--for gallery -->
    <!-- Add fancyBox main JS and CSS files -->
    <script type="text/javascript" src="js/fansy/jquery.fancybox.js"></script>
    <script src="js/fansy/custom.js"></script>


    
    
    <!-- For fixed Navigation -->
    <script type="text/javascript">
        var headerHeight = jQuery('header').height();
        //console.log(headerHeight);
        $(window).scroll(function(){
            if(jQuery(this).scrollTop() > headerHeight){
                $('.navigation-fixed').stop(true, true).slideDown().show();
                $('.navigation-fixed ul li a').removeClass('active');
                $('.navigation-fixed ul li a#service').addClass('active');
                
            } else {
                $('.navigation-fixed').stop(true, true).slideUp().hide();
            }
        });
    </script>
    
    
    <script src="js/jquery.backgroundvideo.min.js"></script>
  <script>
    $(document).ready(function() {
      var videobackground = new $.backgroundVideo($('.hier'), {
        "align": "centerXY",
        "width": 1280,
        "height": 720,
        "path": "media/",
        "filename": "frontend",
        "types": ["mp4","ogg","webm"]
      });
    });
  </script>
    
    
   <script src="js/isotope.pkgd.min.js"></script>
    
    
    <script src="js/owl.carousel.min.js"></script>

<script type="text/javascript">
    

    
    $('.owl-carousel').owlCarousel({
        navText : ["<i class='fa fa-angle-right'></i>","<i class='fa fa-angle-left'></i>"],
    rtl:true,
    loop:true,
    margin:10,
    nav:true,
    responsive:{
        0:{
            items:1
        },
        600:{
            items:1
        },
        1000:{
            items:1
        }
    }
})
</script>
        <!-- Scrolling Nav JavaScript -->
    <script src="js/jquery.easing.min.js"></script>
    <script src="js/scrolling-nav.js"></script>
    
<!-- For same Height -->

<script type='text/javascript'>
  jQuery(document).ready(function(){
   
         //set the starting bigestHeight variable
   var biggestHeight = 0;
         //check each of them
    jQuery('.thumb-img-wrap').each(function(){
         //if the height of the current element is
         //bigger then the current biggestHeight value
     if(jQuery(this).height() > biggestHeight){
          //update the biggestHeight with the
          //height of the current elements
      biggestHeight = jQuery(this).height();
     }
   });
        //when checking for biggestHeight is done set that
        //height to all the elements
  jQuery('.thumb-img-wrap').height(biggestHeight);
   
   });
 </script>
 
 
 

<script type="text/javascript">
    // external js: isotope.pkgd.js

$( document ).ready( function() {
  // init Isotope
  var $container = $('.isotope').isotope({
    itemSelector: '.element-item',
    layoutMode: 'fitRows',
    getSortData: {
      name: '.name',
      symbol: '.symbol',
      number: '.number parseInt',
      category: '[data-category]',
      weight: function( itemElem ) {
        var weight = $( itemElem ).find('.weight').text();
        return parseFloat( weight.replace( /[\(\)]/g, '') );
      }
    }
  });

  // filter functions
  var filterFns = {
    // show if number is greater than 50
    numberGreaterThan50: function() {
      var number = $(this).find('.number').text();
      return parseInt( number, 10 ) > 50;
    },
    // show if name ends with -ium
    ium: function() {
      var name = $(this).find('.name').text();
      return name.match( /ium$/ );
    }
  };

  // bind filter button click
  $('#filters').on( 'click', 'button', function() {
    var filterValue = $( this ).attr('data-filter');
    // use filterFn if matches value
    filterValue = filterFns[ filterValue ] || filterValue;
    $container.isotope({ filter: filterValue });
  });

  // bind sort button click
  $('#sorts').on( 'click', 'button', function() {
    var sortByValue = $(this).attr('data-sort-by');
    $container.isotope({ sortBy: sortByValue });
  });
  
  // change is-checked class on buttons
  $('.button-group').each( function( i, buttonGroup ) {
    var $buttonGroup = $( buttonGroup );
    $buttonGroup.on( 'click', 'button', function() {
      $buttonGroup.find('.is-checked').removeClass('is-checked');
      $( this ).addClass('is-checked');
    });
  });
  
});

</script>

<script type="text/javascript">
        // hide collapse
    $(document).ready(function () {
      $(".navbar-nav li a").click(function(event) {
        $(".navbar-collapse").collapse('hide');
      });
    });

    $(document).ready(function () {
      $(".isotop-collapse button").click(function(event) {
        $(".isotop-collapse").collapse('hide');
      });
    });

</script>

<!-- jQuery for Skillbar -->
<script type="text/javascript" src="js/jquery.appear.js"></script>
<script type="text/javascript">
jQuery(function () {
    "use strict";
    $(document).ready(function(){
        jQuery('.skillbar').each(function() {
            jQuery(this).appear(function() {
                jQuery(this).find('.count-bar').animate({
                    width:jQuery(this).attr('data-percent')
                },3000);
                var percent = jQuery(this).attr('data-percent');
                jQuery(this).find('.count').html('<span>' + percent + '</span>');
            });
        }); 
    });
    
}());
</script>








<!-- Google Analytics -->
<script type="text/javascript">
    var gaJsHost = (("https:" == document.location.protocol) ? "https://ssl." : "http://www.");
    document.write(unescape("%3Cscript src='" + gaJsHost + "google-analytics.com/ga.js' type='text/javascript'%3E%3C/script%3E"));
</script>
<script type="text/javascript">
    try {
    var pageTracker = _gat._getTracker("UA-6179705-12");
    pageTracker._trackPageview();
    } catch(err) {}
</script>


</body>
</html>