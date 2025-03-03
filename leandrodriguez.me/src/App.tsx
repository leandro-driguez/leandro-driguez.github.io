import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import './App.css'

function App() {
  return (<div className="flex flex-col items-center justify-center bg-zinc-100">
    <Avatar className="self-center">
      <AvatarImage src="https://github.com/leandro-driguez.png" />
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
    <p>I'm Leandro, a computer scientist with an amazing passion in AI/ML</p>
  </div>);
}

export default App
