import { StyleSheet } from "react-native";

export const getStyles = (colors: any, listHeaderComponent: any, isDarkMode: boolean = false) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    listContentContainer: {
        paddingBottom: 20,
    },
    fullScreenLoader: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingTop: listHeaderComponent ? 0 : 50,
        backgroundColor: colors.background,
    },
    footerLoadingContainer: {
        paddingVertical: 20,
        alignItems: "center",
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
        marginTop: listHeaderComponent ? 20 : 100,
    },
    emptyListContent: {
        flexGrow: 1, 
        justifyContent: 'center',
        minHeight: 300,
    },
    emptyIcon: {
        marginBottom: 20,
        opacity: 0.7,
    },
    emptyText: {
        fontSize: 16,
        color: colors.textSecondary,
        textAlign: "center",
        lineHeight: 24,
        marginBottom: 20,
    },
    recordButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.tint,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
        shadowColor: colors.tint,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 4,
    },
    recordButtonText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: "600",
        marginLeft: 10,
    },
    separatorContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    separatorLine: {
        flex: 1,
        height: 1,
        backgroundColor: colors.border,
    },
    separatorDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.tint,
        marginHorizontal: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: colors.textSecondary,
        marginBottom: 8,
        paddingHorizontal: 20,
    },
    viewAllButton: {
        paddingHorizontal: 20,
        paddingVertical: 8,
    },
    viewAllText: {
        fontSize: 14,
        color: colors.tint,
        fontWeight: "600",
    },
    statsContainer: {
        flexDirection: "row",
        justifyContent: "space-around",
        paddingVertical: 12,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card,
    },
    statItem: {
        alignItems: "center",
    },
    statNumber: {
        fontSize: 18,
        fontWeight: "bold",
        color: colors.text,
    },
    statLabel: {
        fontSize: 12,
        color: colors.textTertiary,
    },
    loadingContainer: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    list: {
        flex: 1,
    },
    listContent: {
        paddingBottom: 20,
        paddingHorizontal: 16,
    },
}); 