# TCDisrupt2016

## Set up

```sh
brew install ffmpeg youtube-dl
npm install
```

Create a file called *config.json*:

```json
{
  "port": 8080,
  "watson": {
    "alchemy-language": {
      "api_key": "your API key"
    },
    "speech-to-text": {
      "username": "your username",
      "password": "your password"
    },
    "tone-analyzer": {
      "username": "your username",
      "password": "your password"
    }
  },
  "youtube": {
    "api_key": "your API key"
  }
}
```

## Running it

```sh
npm start
```
