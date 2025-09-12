//Logger
const logger = () =>(req, res) => {
  const time = new Date().toISOString()
  console.log(`[${time}] ${req.method} ${req.url}`)
}

export default logger