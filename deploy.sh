#! sh

npm run build && rsync -avh dist/ gcali.me:/var/html/aoc --delete

