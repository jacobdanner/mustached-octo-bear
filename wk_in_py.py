import feedparser
import fnmatch
import os
import glob
from string import Template
import http.client
import urllib.parse
import urllib
import urllib.request
import re
import time


# I know this is bad form, but leaving here while I learn 
# how to use the python apis for html
#from xml.etree.ElementTree import ElementTree
from html.parser import HTMLParser
from html.entities import name2codepoint
#from urllib2 import urlopen

class URLHTMLParser(HTMLParser):
  def __init__(self, url, entry, writer):
    HTMLParser.__init__(self)
    self.entry = entry
    self.template = Template("<li><img src=\"$img1\" width=\"200\" /><p>$title1</p></li>\n")
    self.writer = writer
  
  def handle_starttag(self, tag, attrs):
    if( tag == 'img'):
      attrsD = dict(attrs)
      # print(attrsD)
      if('onmouseover' in attrsD):
        img_pre = attrsD['src']
        img = re.sub("\/thumb", "", img_pre)
        # print("IMG -", img)
        self.writer.write(self.template.substitute(img1=img, title1=self.entry.title))


python_html = open("py_demo.html", 'w')
python_html.write("<!DOCTYPE html>\n<html>\n<head>\n")
python_html.write("<script type=\"text/javascript\" src=\"https://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.js\"></script>\n")
python_html.write("<script type=\"text/javascript\" src=\"https://ajax.googleapis.com/ajax/libs/jqueryui/1.8.18/jquery-ui.js\"></script>\n")


jsTemplate = Template("<script type=\"text/javascript\" src=\"$js1\"></script>\n")
jsfiles = glob.glob("vendor/bootstrap/2.0.3/*/*.js")
jsfiles.extend(glob.glob("vendor/fancybox/2.0.6/*/*.js"))
jsfiles.extend(glob.glob("vendor/GBKS-Wookmark-jQuery-25818a8/*.js"))
jsfiles.extend(glob.glob("vendor/imagesloaded/*/*.js"))
jsfiles.extend(glob.glob("vendor/jquery/1.7.2/*.js"))
jsfiles.extend(glob.glob("vendor/*.js"))
jsfiles.extend(glob.glob("vendor/Sebobo-jquery.rondell-e16e149/*/*.js"))
jsfiles.extend(glob.glob("vendor/Sebobo-jquery.smallipop-67a3f4a/*/*.js"))
for js in jsfiles:
  if js[-6:] != "min.js":
    js_replaced = js.replace('\\','/')
    print(js_replaced)
    python_html.write(jsTemplate.substitute(js1=js_replaced))#re.sub("\\", '/', js)))

cssTemplate = Template("<link rel=\"stylesheet\" type=\"text/css\" media=\"all\" href=\"$css1\" />\n")
cssfiles = glob.glob("vendor/bootstrap/2.0.3/*/*.css")
cssfiles.extend(glob.glob("vendor/**.css"))
cssfiles.extend(glob.glob("vendor/fancybox/2.0.6/helpers/*.css"))
cssfiles.extend(glob.glob("vendor/fancybox/2.0.6/*.css"))
cssfiles.extend(glob.glob("vendor/Sebobo-jquery.rondell-e16e149/**/*.css"))
cssfiles.extend(glob.glob("vendor/Sebobo-jquery.smallipop-67a3f4a/**/*.css"))
cssfiles.extend(glob.glob("vendor/**/**/**/**/**/*.css"))
for css in cssfiles:
  if css[-7:] != "min.css":
    css_replaced = css.replace('\\','/')
    print(css_replaced)
    python_html.write(cssTemplate.substitute(css1=css_replaced))#re.sub('\','\/', css)))

python_html.write("</head>\n<body>\n")
python_html.write("<div id=\"container\">\n<header><h1> Python example using jquery wookmark</h1>\n")
python_html.write("<p>Resize and/or click on item to trigger updates</p>\n")
python_html.write("</header>\n</div>\n")
python_html.write("<div id=\"main\" role=\"main\">\n")
python_html.write("<ul id=\"tiles\">\n")

url = 'http://seattle.craigslist.org/zip/index.rss'
feeds = feedparser.parse(url)["entries"]
#print(feeds)
#print(len(feeds))
start = time.time()

for f in feeds:
  #print(f.link)
  html = URLHTMLParser(f.link, f, python_html)
  req = urllib.request.urlopen(f.link)
  content = req.read().decode('utf-8')
  #print(content)
  html.feed(content)
  html.close()

end = time.time()
print(end-start)

python_html.write("</ul>\n</div>\n")
python_html.write("""<!-- Once the images are loaded, initalize the Wookmark plug-in. -->
  <script type=\"text/javascript\">
    $('#tiles').imagesLoaded(function() {
      // Prepare layout options.
      var options = {
        autoResize: true, // This will auto-update the layout when the browser window is resized.
        container: $('#main'), // Optional, used for some extra CSS styling
        offset: 2, // Optional, the distance between grid items
        itemWidth: 210 // Optional, the width of a grid item
      };
      
      // Get a reference to your grid items.
      var handler = $('#tiles li');
      
      // Call the layout function.
      handler.wookmark(options);
      
      // Capture clicks on grid items.
      handler.click(function(){
        // Randomize the height of the clicked item.
        var newHeight = $('img', this).height() + Math.round(Math.random()*300+30);
        $(this).css('height', newHeight+'px');
        
        // Update the layout.
        handler.wookmark();
      });
    });
  </script>""")

python_html.write("</body>\n</html>")
python_html.close()
