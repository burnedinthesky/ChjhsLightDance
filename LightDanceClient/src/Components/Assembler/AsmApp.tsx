import FracBrowser from "./FracBrowser";

const AsmApp = () => {
    return (
        <div className="h-screen w-full py-10 px-12 font-jbmono">
            <h1 className="font-medium text-3xl">Chingshin Light Dance Assembler</h1>
            <div className="mt-6 w-full flex gap-14 h-full">
                <div className="w-1/2 flex-grow flex flex-col gap-4">
                    <h2 className="text-xl">Dance Fragments</h2>
                    <FracBrowser />
                </div>
                <div className="w-1/2 flex-grow flex flex-col gap-4"></div>
            </div>
        </div>
    );
};

export default AsmApp;
