#! sh

set -e

rm -rf ./dist
docker build -t local_aoc .
docker run -v ./src:/app/src -v ./dist:/app_out/dist local_aoc sh -c "npm run build && cp -rv ./dist /app_out/dist"

rsync -avh dist/dist/ gcali.me:/var/html/aoc/ --delete

