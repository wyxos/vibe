"""Import explicitly licensed Commons media and record each delivery derivative.
Requires Python 3 and FFmpeg/FFprobe on PATH (or VIBE_FIXTURE_FFMPEG).
Raw downloads stay in the caller's --cache directory, outside the repository.
Use --refresh to choose new search results; otherwise the recorded sources replay.
"""
import argparse
import hashlib
import html
import json
import os
from pathlib import Path
import re
import subprocess
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'site/public/media/catalogue'
MANIFEST = ROOT / 'site/public/media/catalogue.json'
AGENT = 'VibeShowcaseMedia/1.0 (https://github.com/wyxos/vibe)'
GROUPS = {
 'image': ['mountain lake', 'coral reef fish', 'desert dunes', 'forest sunlight',
  'city skyline', 'historic architecture', 'cat', 'butterfly flower', 'tropical bird',
  'fresh fruit', 'steam locomotive', 'sailing boat', 'snow mountains', 'street market',
  'waterfall', 'aurora night sky'],
 'video': ['waterfall', 'ocean waves', 'bird', 'train', 'cloud timelapse', 'butterfly',
  'river', 'fish underwater', 'wind trees', 'fountain', 'bee flower', 'sailing'],
 'audio': ['rain', 'ocean waves', 'bird song', 'forest sound', 'church bells',
  'piano music', 'guitar music', 'violin music', 'stream water'],
}
PER_QUERY = {'image': 3, 'video': 2, 'audio': 2}
FILETYPE = {'image': 'bitmap', 'video': 'video', 'audio': 'audio'}

def request(url):
 return urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': AGENT}), timeout=45)

def text(value):
 return re.sub(r'\s+', ' ', html.unescape(re.sub('<[^>]+>', '', value))).strip()

def discover():
 records, used = [], set()
 for kind, queries in GROUPS.items():
  for query in queries:
   params = dict(action='query', generator='search', gsrsearch=f'filetype:{FILETYPE[kind]} {query}',
    gsrnamespace=6, gsrlimit=14, prop='imageinfo', iiprop='url|size|mime|extmetadata', iiurlwidth=960, format='json')
   with request('https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode(params)) as response:
    data = json.load(response)
   accepted = 0
   for page in sorted(data.get('query', {}).get('pages', {}).values(), key=lambda item: item.get('index', 999)):
    info = page['imageinfo'][0]
    meta = info.get('extmetadata', {})
    value = lambda key: text(meta.get(key, {}).get('value', ''))
    license_name = value('LicenseShortName')
    if not re.fullmatch(r'CC BY(?:-SA)? (?:2\.0|2\.5|3\.0|4\.0)|CC0|Public domain', license_name):
     continue
    if page['title'] in used or info.get('size', 0) > 32000000:
     continue
    width, height = info.get('width', 0), info.get('height', 0)
    if kind == 'image' and (info['mime'] not in ['image/jpeg', 'image/png'] or min(width, height) < 400):
     continue
    if kind == 'video' and (not width or not height):
     continue
    if kind == 'audio' and (width or height):
     continue
    license_url = value('LicenseUrl')
    if license_name == 'CC0': license_url = 'https://creativecommons.org/publicdomain/zero/1.0/'
    if license_name == 'Public domain': license_url = 'https://creativecommons.org/publicdomain/mark/1.0/'
    if not license_url.startswith('https://creativecommons.org/') and not license_url.startswith('http://creativecommons.org/'):
     continue
    index = sum(item['kind'] == kind for item in records) + 1
    stem = f'{kind}-{index:02d}'
    source = info.get('thumburl', info['url']) if kind == 'image' else info['url']
    records.append(dict(id=stem, kind=kind, collection=query.title(),
     title=re.sub(r'\.(?:jpg|jpeg|png|webm|ogg|ogv|mp3|wav|flac)$', '', page['title'][5:], flags=re.I),
     sourceUrl=info['descriptionurl'], sourceMediaUrl=source.split('?')[0],
     sourceWidth=width, sourceHeight=height, sourceMime=info['mime'],
     credit=dict(author=value('Artist') or value('Attribution') or 'See source credits',
      license=license_name, licenseUrl=license_url.replace('http:', 'https:'),
      copyright=value('Copyrighted'), attribution=value('Attribution'),
      originalTitle=page['title'][5:], sourceUrl=info['descriptionurl'])))
    used.add(page['title']); accepted += 1
    if accepted == PER_QUERY[kind]: break
   print(f'{kind}: {query}: {accepted}', flush=True)
 return records

def encode(record, cache, ffmpeg):
 source_key = hashlib.sha256(record['sourceMediaUrl'].encode()).hexdigest()[:16]
 source = cache / (record['id'] + '-' + source_key + '.source')
 if not source.exists():
  with request(record['sourceMediaUrl']) as response, source.open('wb') as destination:
   while chunk := response.read(1024 * 1024): destination.write(chunk)
 kind = record['kind']
 extension = {'image': 'webp', 'video': 'mp4', 'audio': 'm4a'}[kind]
 destination = OUT / f"{record['id']}.{extension}"
 common = [ffmpeg, '-y', '-hide_banner', '-loglevel', 'error', '-i', str(source), '-map_metadata', '-1', '-map_chapters', '-1']
 if kind == 'image':
  options = ['-frames:v', '1', '-c:v', 'libwebp', '-quality', '82']
  changes = 'Delivery thumbnail encoded as WebP; metadata removed; no creative edit.'
 elif kind == 'video':
  factor = min(1, 720 / max(record['sourceWidth'], record['sourceHeight']))
  width = max(2, round(record['sourceWidth'] * factor / 2) * 2)
  height = max(2, round(record['sourceHeight'] * factor / 2) * 2)
  options = ['-t', '8', '-vf', f'scale={width}:{height}', '-r', '24', '-c:v', 'libx264',
   '-preset', 'fast', '-crf', '26', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '64k', '-movflags', '+faststart']
  changes = 'First eight seconds, resized to at most 720px, H.264/AAC delivery encoding, 24fps; metadata removed.'
 else:
  options = ['-t', '16', '-vn', '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart']
  changes = 'First sixteen seconds encoded as AAC; metadata removed.'
 subprocess.run(common + options + [str(destination)], check=True, stdout=subprocess.DEVNULL, timeout=180)
 probe = str(Path(ffmpeg).with_name('ffprobe.exe')) if ffmpeg.lower().endswith('.exe') else 'ffprobe'
 details = json.loads(subprocess.check_output([probe, '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(destination)], timeout=30))
 visual = next((stream for stream in details['streams'] if stream['codec_type'] == 'video'), {})
 record.update(file=f'catalogue/{destination.name}', width=visual.get('width'), height=visual.get('height'),
  duration=float(details['format'].get('duration', 0)), bytes=destination.stat().st_size,
  sha256=hashlib.sha256(destination.read_bytes()).hexdigest(), changes=changes)
 if kind == 'audio':
  cover = OUT / f"{record['id']}-cover.png"
  subprocess.run([ffmpeg, '-y', '-loglevel', 'error', '-i', str(destination),
   '-filter_complex', 'aformat=channel_layouts=mono,showwavespic=s=640x640:colors=0x06b6d4',
   '-frames:v', '1', str(cover)], check=True, timeout=45)
  record['cover'] = dict(file='catalogue/' + cover.name, width=640, height=640,
   bytes=cover.stat().st_size, sha256=hashlib.sha256(cover.read_bytes()).hexdigest())
  changes += ' Waveform cover rendered from this audio excerpt under the same license.'
  record['changes'] = changes
 record['credit']['changes'] = changes
 return record

def main():
 parser = argparse.ArgumentParser()
 parser.add_argument('--cache', required=True, type=Path)
 parser.add_argument('--refresh', action='store_true')
 args = parser.parse_args()
 args.cache.mkdir(parents=True, exist_ok=True); OUT.mkdir(parents=True, exist_ok=True)
 selection = args.cache / 'selected.json'
 records = discover() if args.refresh or not selection.exists() else json.loads(selection.read_text(encoding='utf-8'))
 selection.write_text(json.dumps(records, indent=2, ensure_ascii=False), encoding='utf-8')
 results = []
 ffmpeg = os.environ.get('VIBE_FIXTURE_FFMPEG', 'ffmpeg')
 for record in records:
  try:
   results.append(encode(record, args.cache, ffmpeg)); print('ready ' + record['id'], flush=True)
  except Exception as error:
   print(f"skip {record['id']}: {type(error).__name__}", flush=True)
 (ROOT / 'site/catalogue.generated.json').write_text(json.dumps([
  {key: item[key] for key in ['id', 'kind', 'collection', 'title', 'file', 'width', 'height', 'duration', 'credit']}
  for item in results], indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
 MANIFEST.write_text(json.dumps(dict(schemaVersion=1, source='Wikimedia Commons', thirdPartyMediaUsed=True,
  licenseNotice='Each source and its delivery derivative retain the per-asset license below. These licenses are independent of the Vibe code license.',
  assets=results), indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
 print(json.dumps({kind:sum(item['kind']==kind for item in results) for kind in GROUPS}), flush=True)

if __name__ == '__main__': main()
