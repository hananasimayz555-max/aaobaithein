import re,sys
G=sys.argv[1]; R='/home/user/aaobaithein/whatsales-redesign/'
idx=open(R+'index.html').read()
head='''<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Profitability — WhatSales</title>
<meta name="description" content="WhatSales Profitability: a monthly P&L built from every fee, ad, refund and cost, across every channel.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/site.css">
<style>
'''+open(G+'/product.css').read()+'''</style>
</head>
'''
body=idx[idx.index('<body>'):idx.index('<main>')]
body=body.replace('href="#platform" data-open="0"','href="profitability.html"')
body=re.sub(r'href="#(platform|integrations|results|roles|faq|demo|features|about|brands)"',lambda m:f'href="index.html#{m.group(1)}"',body)
body=body.replace('href="#" class="logo"','href="index.html" class="logo"')
body=body.replace('<a href="#platform" data-open="8">See how →</a>','<a href="index.html#platform">See how →</a>')
main=open(G+'/product_main.html').read()
foot=idx[idx.index('<!-- FINAL CTA + FOOTER -->'):idx.index('</footer>')+9]
foot=re.sub(r'href="#(p\d)" data-open="\d"',lambda m:'href="'+('profitability.html' if m.group(1)=='p0' else 'index.html#platform')+'"',foot)
foot=re.sub(r'href="#(platform|integrations|results|roles|faq|features)"',lambda m:f'href="index.html#{m.group(1)}"',foot)
foot=foot.replace('Close the other fifteen tabs. <em>Run it all from WhatSales.</em>','See your real profit. <em>On your own data.</em>')
tail='\n<script src="https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.min.js"></script>\n<script>\n'+open(G+'/product.js').read()+'</script>\n</body>\n</html>\n'
open(R+'profitability.html','w').write(head+body+main+'\n'+foot+tail)
print('built')
