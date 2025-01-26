// import React from 'react';

// type ProgressBarProps = {
//     currentStep: number;
//     totalSteps: number;
//     icons: React.ReactNode[];
// };

// export const ProgressBarWithIcons: React.FC<ProgressBarProps> = ({ currentStep, totalSteps, icons }) => {
//     const widthPercentages = ['w-0', 'w-[38%]', 'w-[61%]', 'w-[90%]'];

//     return (
//         <div className="inline-block w-full">
//             <div className="relative z-[1]">
//                 <div className={`${currentStep > 1 ? widthPercentages[currentStep - 1] : ''} bg-[#4361EE] h-1 absolute ltr:left-0 rtl:right-[-12px] top-[30px] m-auto -z-[1] transition-[width]`}></div>
//                 <ul className="mb-5 grid grid-cols-4">
//                     {icons.map((icon, index) => (
//                         <li key={index} className="mx-auto">
//                             <button
//                                 type="button"
//                                 className={`${
//                                     currentStep === index + 1 ? '!border-[#4361EE] !bg-[#4361EE] text-white' : ''
//                                 } border-[3px] border-[#f3f2ee] bg-white dark:bg-[#4361EE] dark:border-[#4361EE] flex justify-center items-center w-16 h-16 rounded-full`} // Adjusted size to 80px
//                                 disabled
//                             >
//                                 {icon}
//                             </button>
//                             <span className={`${currentStep === index + 1 ? 'text-[#4361EE] ' : ''} text-center block mt-2 font-semibold `}>{`Step ${index + 1}`}</span>
//                         </li>
//                     ))}
//                 </ul>
//             </div>
//         </div>
//     );
// };
