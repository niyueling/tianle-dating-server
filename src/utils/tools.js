const paySuccess = {
  payload: {
    unionid: '',
    phone: '',
  },
  cmd: 'createNewPlayer'
}
console.log(`PUBLISH  adminChannelToDating '${JSON.stringify(paySuccess)}'`)
