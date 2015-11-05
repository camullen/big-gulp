/*
 * MyApp
 * Root controller view for entire app
 * <MyApp />
 */

const React = require('react');


class MyApp extends React.Component {
  constructor(props){
    super(props)
  }
  render() {
    return (
      <div>
        <h1>Hello, React!!!</h1>
      </div>
    )
  }
}

module.exports = MyApp;