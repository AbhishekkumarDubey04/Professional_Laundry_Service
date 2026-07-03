import urllib.request, re
req = urllib.request.Request('https://tenor.com/search/washing-machine-gifs', headers={'User-Agent': 'Mozilla/5.0'})
try:
    html = urllib.request.urlopen(req).read().decode('utf-8')
    urls = re.findall(r'https://media\.tenor\.com/[^"]+\.gif', html)
    print(urls[0] if urls else 'No GIFs found')
except Exception as e:
    print(e)
