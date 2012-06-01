require 'rss'
require 'open-uri'
require 'nokogiri'
#require 'fileutils'


item_link = "http://seattle.craigslist.org/oly/zip/3051191219.html"
item_title = "Free hottub  (Lacey, wa)"
url = 'http://seattle.craigslist.org/zip/index.rss'
File.open("demo.html", "w") do |f|
f.puts "<!DOCTYPE html>\n<html>\n<head>\n"

f.puts "<script type=\"text/javascript\" src=\"https://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.js\"></script>"
f.puts "<script type=\"text/javascript\" src=\"https://ajax.googleapis.com/ajax/libs/jqueryui/1.8.18/jquery-ui.js\"></script>"

# add all the js and css files from the vendor dir
Dir.glob("vendor/**/*.js").each do |js|
  f.puts "<script type=\"text/javascript\" src=\"#{js}\"></script>" unless js.to_s.end_with? ".min.js"
end
Dir.glob("vendor/**/*.css").each do |css|
  f.puts "<link rel=\"stylesheet\" href=\"#{css}\" type=\"text/css\" media=\"all\"/>" unless css.to_s.end_with? "min.css"
end

f.puts "</head>\n<body>\n"
f.puts "<div id=\"container\">\n<header><h1> example using jquery wookmark</h1>\n"
f.puts "<p>Resize and/or click on item to trigger updates</p>\n"
f.puts "</header>\n</div>"
f.puts "<div id=\"main\" role=\"main\">\n"
f.puts "<ul id=\"tiles\">\n"

open(url) do |rss|
  feed = RSS::Parser.parse(rss)
  puts "Title: #{feed.channel.title}"
  feed.items.each do |item|
    puts "Item: #{item.title}"
    #html = Nokogiri::HTML(File.open("Freehottub.htm"))
    html = Nokogiri::HTML(open(item.link))
    
    # The thumbnails come from here, 
    # if we wanted to get more specific
    # we could do a starts-with check on the attribute
    # img/onmouseover=iwMouseover
    # fn:starts-with(@onmouseover, 'iwMouseover')
    imgs = html.xpath('//img[@onmouseover]')#[starts-with(@onmouseover,"iwMouseOver"]')
    # puts "IMAGES - #{imgs.to_s}"
    # if no images, ignore item
    if imgs
      imgs.each do |img|
        # reference the full size picture
        ig = img["src"].sub("/thumb", "")
        # puts "IMGS - #{ig}"
        f.puts "<li><img src=\"#{ig}\" width=\"200\"/><p>#{item.title}</p></li>"
      end
    end
  end
end


f.puts "</ul>\n</div>"

f.puts """<!-- Once the images are loaded, initalize the Wookmark plug-in. -->
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
  </script>"""

f.puts "</body>\n</html>"

end

