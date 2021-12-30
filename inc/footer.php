

<!-- footer-top section start 
    ================================================== -->
 
    <div class="sercices footer-top">
    	<div class="container clearfix">
        	<div class="row">
            	<div class="col-md-12 ser">
                	<h2>Contact</h2>
                    <div class="border-left"></div>
                    <div class="hex divider">
                        <div class="hex divider inner">
                            <div class="hex divider inner2">
                            </div>
                        </div>
                    </div>
                    <div class="border-right"></div>
                    
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
                                    	<p>Crisalnp@yahoo.com</p>
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div class="col-md-6 col">
                    	<div class="foot-contact social social-roll">
                                                  
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
                    <div class="divider">
            		<div class="border-left"></div>
                    <div class="hex divider">
                        <div class="hex divider inner">
                            <div class="hex divider inner2">
                            </div>
                        </div>
                    </div>
                    <div class="border-right"></div>
            </div>
            		</div>
                    
                   <div class="shape"></div>
                   <div class="email">
                   <form role="form" method="post">
                      <div class="form-group col-md-6">
                        <input type="text" class="form-control" name="Name" placeholder="Enter Name" required>
                      </div>
                      <div class="form-group col-md-6">
                        <input type="email" class="form-control" name="Email" id="exampleInputEmail1" placeholder="Enter E mail" required>
                      </div>
                      <div class="form-group col-md-10 col-md-offset-1">
                        <textarea class="form-control" name="Comment" rows="3" required></textarea>
                      </div>
                      <div class="form-group">
                        <button type="submit" name="submit" class="btn btn-default">Send Message</button>
                      </div>
                      
                       </form>
                   </div>
                   
            </div>
            
  <!-- for contact message -->
             <?php 
if(isset($_POST['submit']))
{
	
	$to = 'crisalnp@hotmail.com';
/*	$ToEmail .="ram_1029@hotmail.com";
	$ToEmail .="ram7_prajapati@yahoo.com";*/
	$EmailSubject = 'Client Message'; 
	$mailheader = 'MIME-Version: 1.0' . "\r\n";
	$mailheader .= "From: ".$_POST["Email"]."\r\n"; 
	$mailheader .= "Reply-To: ".$_POST["Email"]."\r\n"; 
	$mailheader .= "Content-type: text/html; charset=iso-8859-1\r\n"; 
	$MESSAGE_BODY= "Name: ".$_POST["Name"]."<br>"; 
	//$MESSAGE_BODY .= "Address: ".$_POST["Address"]."<br>";
	$MESSAGE_BODY .= "Email: ".$_POST["Email"]."<br>"; 
	//MESSAGE_BODY .= "Contact No.: ".$_POST["Phone_no"]."<br>";
	$MESSAGE_BODY .= "Comment: ".$_POST["Comment"]."<br>"; 
	if(mail($to, $EmailSubject, $MESSAGE_BODY, $mailheader))
	{
	?>
	<script>
	alert('Your mail has been sent. Thank you !!!');
	window.location='index.php'
    </script>
    <?php
	}
	else
	{
		?>
	<script>
	alert('Your mail has not sent. !!!');
	window.location='index.php'
    </script>
    <?php
	}
}
?> 

 <!-- for contact message -->            
            
        </div>
    </div>
</div>
   
   
<!-- footer-top section end
    ================================================== -->


<!-- Hier Me section start 
    ================================================== -->
 
    <div class="hire footer-social-icons">
        <div class="me">&nbsp;</div>
        <div class="container clearfix">
           <div class="row">
            <div class="col-md-12">
                <h1>Rajweb Design</h1>
                <div class="sicialise">
                <ul>
                    <li>
                        <a href="https://facebook.com"><i class="fa fa-facebook"></i></a>
                    </li>
                    <li>
                        <a href="https://twitter.com"><i class="fa fa-twitter"></i></a>
                    </li>
                    <li>
                        <a href="https://google-plus.com"><i class="fa fa-google-plus"></i></a>
                    </li>
                    <li>
                        <a href="https://flickr.com"><i class="fa fa-flickr"></i></a>
                    </li>
                    <li>
                        <a href="https://skype.com"><i class="fa fa-skype"></i></a>
                    </li>
                    <li>
                        <a href="https://youtube.com"><i class="fa fa-youtube"></i></a>
                    </li>
                    <li>
                        <a href="https://facebook.com"><i class="fa fa-facebook"></i></a>
                    </li>
                   
                </ul>           
                <p> 2014 © Rajweb Design.com.np,All rights are reserved.Designed By Rajaram !</p>
               
                
            </div>
           </div>
        </div>
    </div>
       
       
    <!-- Hier Me section end
        ================================================== -->
        
    
    
        
    </div>
