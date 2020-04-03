import Container from '@material-ui/core/Container';
import CssBaseline from '@material-ui/core/CssBaseline';
import Page from '../components/Page';
import Data from '../components/Data';
import Navbar from '../components/Navbar';
import Subcribe from '../components/Subcribe';
import Head from 'next/head';
const style = {
  background: '#457fca' /* fallback for old browsers */,
  background:
    '-webkit-linear-gradient(to right, #5691c8, #457fca)' /* Chrome 10-25, Safari 5.1-6 */,
  background:
    'linear-gradient(to right, #5691c8, #457fca)' /* W3C, IE 10+/ Edge, Firefox 16+, Chrome 26+, Opera 12+, Safari 7+ */,
  height: '100vh'
};
const Index = () => (
  <Page>
    <Head>
      <title>Hello</title>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap"
      />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/icon?family=Material+Icons"
      />
    </Head>
    <CssBaseline></CssBaseline>
    <div fixed style={style}>
      <Container>
        <Navbar></Navbar>
        <h1>Find Me A Job</h1>
        <Subcribe></Subcribe>
        <Data />
      </Container>
    </div>
  </Page>
);

export default Index;
