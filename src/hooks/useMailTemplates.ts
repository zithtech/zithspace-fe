import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    MailTemplateService,
    MailTemplatePayload,
    MailTemplate,
    MailSignature,
    PlaceholderGroup,
    TemplateCategory,
    TemplateRecipient,
} from "@/services/mailTemplateService";

export const mailTemplateKeys = {
    all: ["mail-templates"] as const,
    list: (search?: string, category?: string) =>
        [...mailTemplateKeys.all, "list", search ?? "", category ?? ""] as const,
    categories: () => [...mailTemplateKeys.all, "categories"] as const,
    signature: () => [...mailTemplateKeys.all, "signature"] as const,
    placeholders: () => [...mailTemplateKeys.all, "placeholders"] as const,
    recipients: (search?: string) => [...mailTemplateKeys.all, "recipients", search ?? ""] as const,
};

export const useMailTemplates = (search?: string, category?: string) => {
    return useQuery<MailTemplate[]>({
        queryKey: mailTemplateKeys.list(search, category),
        queryFn: async () => (await MailTemplateService.list(search, category)) || [],
    });
};

/**
 * The category shelves, with counts. Invalidated alongside the templates
 * themselves, since filing a template is what creates and empties a shelf.
 */
export const useTemplateCategories = () => {
    return useQuery<TemplateCategory[]>({
        queryKey: mailTemplateKeys.categories(),
        queryFn: async () => (await MailTemplateService.getCategories()) || [],
    });
};

/**
 * The placeholder catalogue never changes between deploys, so it is cached for
 * the session rather than refetched every time the editor opens.
 */
export const usePlaceholderGroups = () => {
    return useQuery<PlaceholderGroup[]>({
        queryKey: mailTemplateKeys.placeholders(),
        queryFn: async () => (await MailTemplateService.getPlaceholders())?.groups || [],
        staleTime: Infinity,
    });
};

export const useTemplateRecipients = (search?: string, enabled = true) => {
    return useQuery<TemplateRecipient[]>({
        queryKey: mailTemplateKeys.recipients(search),
        queryFn: async () => (await MailTemplateService.getRecipients(search)) || [],
        enabled,
    });
};

/**
 * The signed-in member's signature. When they have never saved one, what comes
 * back is built from their own profile — so the editor is never empty.
 */
export const useMailSignature = () => {
    return useQuery<MailSignature>({
        queryKey: mailTemplateKeys.signature(),
        queryFn: () => MailTemplateService.getSignature(),
    });
};

export const useMailSignatureActions = () => {
    const queryClient = useQueryClient();
    const invalidate = () =>
        queryClient.invalidateQueries({ queryKey: mailTemplateKeys.signature() });

    const saveSignature = useMutation({
        mutationFn: (html: string) => MailTemplateService.saveSignature(html),
        onSuccess: invalidate,
    });

    const resetSignature = useMutation({
        mutationFn: () => MailTemplateService.resetSignature(),
        onSuccess: invalidate,
    });

    return {
        saveSignature: saveSignature.mutateAsync,
        isSavingSignature: saveSignature.isPending,
        resetSignature: resetSignature.mutateAsync,
        isResettingSignature: resetSignature.isPending,
    };
};

export const useMailTemplateActions = () => {
    const queryClient = useQueryClient();
    const invalidate = () => queryClient.invalidateQueries({ queryKey: mailTemplateKeys.all });

    const createTemplate = useMutation({
        mutationFn: (payload: MailTemplatePayload) => MailTemplateService.create(payload),
        onSuccess: invalidate,
    });

    const updateTemplate = useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: Partial<MailTemplatePayload> }) =>
            MailTemplateService.update(id, payload),
        onSuccess: invalidate,
    });

    const deleteTemplate = useMutation({
        mutationFn: (id: string) => MailTemplateService.remove(id),
        onSuccess: invalidate,
    });

    const setDefaultTemplate = useMutation({
        mutationFn: (id: string) => MailTemplateService.setDefault(id),
        onSuccess: invalidate,
    });

    return {
        createTemplate: createTemplate.mutateAsync,
        isCreating: createTemplate.isPending,

        updateTemplate: updateTemplate.mutateAsync,
        isUpdating: updateTemplate.isPending,

        deleteTemplate: deleteTemplate.mutateAsync,
        isDeleting: deleteTemplate.isPending,

        setDefaultTemplate: setDefaultTemplate.mutateAsync,
        isSettingDefault: setDefaultTemplate.isPending,
    };
};
