import React from 'react'
import Box from 'grommet/components/Box'
import Markdown from 'grommet/components/Markdown'

import {help} from './../backend'

class PageHelp extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      text: '',
    }
  }
  componentDidMount() {
    help(window.location.pathname.split('/').pop(), response => this.setState({text: response}))
  }
  render() {
    return (
      <Box pad='large' align='center' className='help'>
        <Markdown
          content={this.state.text}
          components={{
            'a': {props: {target: '_blank'}},
          }}
        />
      </Box>
    )
  }
}

export default PageHelp
