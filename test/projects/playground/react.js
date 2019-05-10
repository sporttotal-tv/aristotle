import React from 'react'
import ReactDOM from 'react-dom'
import datas from './datas'

const Corner = () => {
  return (
    <svg
      viewBox="0 0 20 20"
      style={{
        fill: 'red',
        width: 20,
        height: 20
      }}
    >
      <circle cx={10} cy={10} r={10} />
    </svg>
  )
}

const Title = ({ title, fontSize }) => {
  return (
    <h1 className="bla" style={{ fontSize }}>
      {title}
      <Corner />
    </h1>
  )
}

const Item = ({ item }) => {
  return (
    <div>
      <Title title={item.title} fontSize={10} />
      {item.description}
    </div>
  )
}

const List = ({ data }) => {
  return data.map((item, i) => <Item key={i} item={item} />)
}

// const App = ({ datas }) => {
//   const [index, setIndex] = useState(0);
//   return (
//     <div>
//       <button
//         onClick={() => {
//           setIndex(index === datas.length - 1 ? 0 : index + 1);
//         }}
//       />
//       <List data={datas[index]} />
//     </div>
//   );
// };
// ReactDOM.render(<App datas={datas} />, document.body);

const App = () => {
  return <List data={datas[0]} />
}

const holder = document.createElement('div')

document.body.appendChild(holder)

var d = Date.now()
ReactDOM.render(<App />, holder)
console.log('REACT', Date.now() - d, 'ms', datas[0].length)
