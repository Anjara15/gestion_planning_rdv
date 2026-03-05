import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Header = ({ logout }) => (
  <header className="flex justify-end border-b border-border pb-5">
    <nav className="flex items-center gap-6">
      <Link to="/" className="text-primary hover:text-primary-hover font-medium">
        Accueil
      </Link>
      <Button
        variant="outline"
        onClick={logout}
        className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
      >
        Se déconnecter
      </Button>
    </nav>
  </header>
);

export default Header;