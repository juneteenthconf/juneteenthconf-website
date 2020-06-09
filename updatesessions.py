import requests
import json
import os
import PIL
from PIL import Image

print('Beginning file download with requests > schedule.json')

#url = '&url=https://sessionize.com/api/v2/00qwwaih/view/All&sessionlist=true'
#r = requests.get(url)

#with open('src/talks.json', 'wb') as f:
#    f.write(r.content)

print('Beginning file download with requests > live.json')
    
    
#url = '&url=https://sessionize.com/api/v2/00qwwaih/view/All'
#rl = requests.get(url)

#with open('src/live.json', 'wb') as f:
#    f.write(rl.content)    

print('Beginning file download images')

#data = json.loads(r.content)

os.mkdir("speaker")
os.mkdir("speakerimages")

#for session in data['sessions']:
#    for speaker in session['speakers']:

#        name = speaker['id']
#        img_url = speaker['profilePicture']
#        img_r = requests.get(img_url)
#        print(img_r.headers['Content-Type'])
#        file_format="jpg"
#        if img_r.headers['Content-Type'] == "image/png":
#            file_format = "png"

#        with open('speaker/'+name+"."+file_format, 'wb') as f:
#            f.write(img_r.content)

#        image = Image.open('speaker/'+name+"."+file_format)
#        maxsize = (300, 300)
#        image.thumbnail(maxsize, PIL.Image.ANTIALIAS)
#        image = image.convert('RGB')
#        image.save('speakerimages/'+name+".jpg","JPEG")
#        print(name)