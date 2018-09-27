const x = async () => {
  const bla = await global.fetch('x')
}

const X = props => {
  return (
    <div
      style={{
        ':hover': {
          boder: `1px solid ${props.color}`
        }
      }}
    >
      hello
    </div>
  )
}

export { X, x }
