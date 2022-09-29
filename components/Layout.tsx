import Header from "./Header";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="h-full min-h-full">
      <Header />
      {children}
    </div>
  );
};

export default Layout;
