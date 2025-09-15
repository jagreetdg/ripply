export type AuthType = 'login' | 'signup';

export interface AuthModalProps {
    isVisible: boolean;
    onClose: () => void;
    type: AuthType;
    onSwitchToLogin?: () => void;
    onSwitchToSignup?: () => void;
}

export interface AuthFormProps {
    type: AuthType;
    onAuth: () => void;
}

export interface AuthHeaderProps {
    type: AuthType;
    onClose: () => void;
}

export interface AuthFooterProps {
    type: AuthType;
    onSwitchToLogin?: () => void;
    onSwitchToSignup?: () => void;
}
