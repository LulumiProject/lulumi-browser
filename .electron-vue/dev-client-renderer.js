const hotClient = require('webpack-hot-middleware/client?name=renderer&noInfo=true&reload=true')

hotClient.subscribe(event => {
  if (event.action === 'reload') {
    window.location.reload()
  }
})
