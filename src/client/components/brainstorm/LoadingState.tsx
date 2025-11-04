interface LoadingStateProps {
  message?: string;
}

export const LoadingState = ({ message = 'Loading question...' }: LoadingStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="animate-pulse space-y-4 text-center">
        <div className="w-12 h-12 border-4 border-[#222222] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
};

