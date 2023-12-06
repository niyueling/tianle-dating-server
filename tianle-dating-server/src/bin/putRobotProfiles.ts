import {readFileSync} from 'fs'
import {join} from 'path'
import createRedisClient from '../utils/redis'


async function main() {
  const redis : any= createRedisClient()

  const profiles = readFileSync(join(__dirname, '..', '..', 'names.json'), 'utf-8').trim().split('\n')

  console.log(`${__filename}:13 main`, profiles);

  await redis.delAsync('profiles')
  await redis.lpushAsync('profiles', profiles)
  console.log(`${profiles.length} profiles add`);
  redis.quit();
}


main()

