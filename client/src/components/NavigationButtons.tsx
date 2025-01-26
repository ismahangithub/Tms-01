import React from 'react';
import { Button } from '../components/ui/button';

type NavigationButtonsProps = {
    currentStep: number;
    totalSteps: number;
    onNext: () => void;
    onBack: () => void;
};

export const NavigationButtons: React.FC<NavigationButtonsProps> = ({ currentStep, totalSteps, onNext, onBack }) => {
    return (
        <div className="flex justify-between mt-5">
            <Button type="button" className={`btn btn-primary ${currentStep === 1 ? 'hidden' : ''}`} onClick={onBack}>
                Back
            </Button>
            <Button type="button" className="btn btn-primary ml-auto" onClick={onNext}>
                {currentStep === totalSteps ? 'Finish' : 'Next'}
            </Button>
        </div>
    );
};
