# encoding: UTF-8
# build.rb — bundle the split project (index.html + css/ + js/) into a single
# self-contained HTML for publishing as a Claude Artifact.
#
# Usage:  ruby build.rb [output_path]
# Default output: dist/kuchki.bundle.html
require 'fileutils'

def read_utf8(path); File.read(path, encoding: 'UTF-8'); end

root = File.expand_path(File.dirname(__FILE__))
html = read_utf8(File.join(root, 'index.html'))
css  = read_utf8(File.join(root, 'css/style.css'))

head = html[/<head>(.*?)<\/head>/m, 1]
body = html[/<body>(.*?)<\/body>/m, 1]

title = head[/<title>.*?<\/title>/m]
# keep the Google Fonts <link>s, drop the local stylesheet link (we inline it)
links = head.scan(/<link[^>]*>/).reject { |l| l.include?('css/style.css') }.join("\n")

# inline every local script, in the order index.html lists them
body = body.gsub(%r{<script src="(js/[\w.-]+\.js)(?:\?[^"]*)?"></script>}) do
  "<script>\n#{read_utf8(File.join(root, Regexp.last_match(1)))}\n</script>"
end

# The Artifact host wraps content in <!doctype>/<html>/<head>/<body>, so emit
# only the inner content: title + font links + inlined <style> + body markup.
bundle = <<~HTML
  #{title}
  #{links}
  <style>
  #{css}
  </style>
  #{body.strip}
HTML

out = ARGV[0] || File.join(root, 'dist', 'kuchki.bundle.html')
FileUtils.mkdir_p(File.dirname(out))
File.write(out, bundle)
puts "built #{out} (#{bundle.bytesize} bytes)"
