import {AcademicCapIcon} from "@heroicons/react/24/solid";

export default function Home() {
  return (
   <div className={'flex items-center h-[calc(100vh-160px)] justify-center'}>
       <div className={'flex flex-col justify-center items-center gap-5 text-5xl text-green-900 dark:text-purple-400 font-bold'}>
           <AcademicCapIcon className={'w-96 h-96'} />
           <div>Welcome to MyStackOverflow!</div>
       </div>
   </div>
  );
}
