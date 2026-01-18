import re
import sys
import json
import argparse
from os import remove
from pathlib import Path
from urllib.request import urlopen

ANIME_URL = "https://malscraper.azurewebsites.net/covers/all/anime/presets/animetitle"
MANGA_URL = "https://malscraper.azurewebsites.net/covers/all/manga/presets/animetitle"
PATTERN = re.compile(r'\.animetitle\[href\^="/(anime|manga)/(\d+)/"\]')
CSS_PATTERN = r'&[href^="https://myanimelist.net/\1/\2/"]'
JSON_PATTERN = re.compile(r'\.animetitle\[href\^="/(anime|manga)/(\d+)/"\]\{background-image:url\(([^)]+)\)\}')

def fetch_url(url: str) -> str:
  with urlopen(url) as response:
    return response.read().decode("utf-8")


def import_sources(output_file: Path):
  print("Importing source CSS files...")
  anime_css = fetch_url(ANIME_URL)
  manga_css = fetch_url(MANGA_URL)
  combined = anime_css.rstrip() + "\n\n" + manga_css.lstrip()
  output_file.write_text(combined, encoding="utf-8")


def convert_css(input_file: Path, output_file: Path):
  text = input_file.read_text(encoding="utf-8")
  converted = PATTERN.sub(CSS_PATTERN, text)
  output_file.write_text(converted, encoding="utf-8")
  print(f"Converted file written to: {output_file}")


def convert_to_json(input_file: Path, output_file: Path):
  text = input_file.read_text(encoding="utf-8")
  matches = JSON_PATTERN.findall(text)
  result = {
    "anime": {},
    "manga": {}
  }
  
  for media_type, id_number, image_url in matches:
    result[media_type][int(id_number)] = image_url
  
  output_file.write_text(json.dumps(result, indent=2), encoding="utf-8")
  print(f"JSON file written to: {output_file}")


def get_output_path(args, source_file: Path, is_json: bool) -> Path:
  """Determine the output path based on arguments."""
  if args.output:
    return Path(args.output)
  else:
    if is_json:
      return source_file.with_suffix(".json")
    else:
      return source_file.with_stem(source_file.stem + "_converted")


def process_files(source_file: Path, args):
  """Process the source file for either JSON or CSS conversion."""
  if args.json:
    output_path = get_output_path(args, source_file, is_json=True)
    convert_to_json(source_file, output_path)
  else:
    output_path = get_output_path(args, source_file, is_json=False)
    convert_css(source_file, output_path)


def main():
  parser = argparse.ArgumentParser()
  parser.add_argument("input", nargs="?", help="Input CSS file")
  parser.add_argument("-i", "--import", dest="do_import", action="store_true", help="Imports anime and manga images from malscraper and outputs to the desired format")
  parser.add_argument("-o", "--output", help="Output file name")
  parser.add_argument("-j", "--json", action="store_true", help="Output to JSON format")
  args = parser.parse_args()

  script_dir = Path(__file__).parent

  # IMPORT MODE
  if args.do_import and not args.input:
    source_file = script_dir / "source_images.css"
    import_sources(source_file)
    process_files(source_file, args)
    remove(source_file)
    return

  # INPUT MODE
  if not args.input:
    parser.error("input file is required unless --import is used")

  input_path = Path(args.input)
  if not input_path.exists():
    sys.exit(f"Error: file not found: {input_path}")

  process_files(input_path, args)


if __name__ == "__main__":
  main()