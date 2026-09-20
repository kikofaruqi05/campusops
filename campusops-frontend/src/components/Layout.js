import Navbar from './Navbar';

const Layout = ({ children }) => {
  return (
    <div style={styles.wrapper}>
      <Navbar />
      <main style={styles.main}>
        {children}
      </main>
    </div>
  );
};

const styles = {
  wrapper: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  },
  main: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem 2.5rem',
  },
};

export default Layout;