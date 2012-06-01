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

f.puts "</head><body>"
#open(url) do |rss|
#  feed = RSS::Parser.parse(rss)
#  puts "Title: #{feed.channel.title}"
#  feed.items.each do |item|
#    puts "Item: #{item.title}"
    html = Nokogiri::HTML(File.open("Freehottub.htm")) # open(item.link))
    
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
        f.puts "<div class=\"pin\">\n"
        f.puts "<a class=\"fancybox\" rel=\"pins\" href=\"#{item_link}\">\n"
        f.puts "<img src=\"#{ig}\" width=\"200\" />\n"
        f.puts "</a>\n"
        f.puts "<p>#{item_title}</p>\n"
        f.puts "</div>\n"
      end
    end
  #end
#end
f.puts "</body>\n</html>"

end

