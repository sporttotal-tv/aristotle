const datas = [
  [{ title: 'yesh', description: 'bla' }],
  [{ title: 'gur', description: 'snurf' }]
]

for (let i = 0; i < 500; i++) {
  datas[0][i] = {
    title: 'yesh ' + i,
    description: 'infos ' + i
  }
}

export default datas
