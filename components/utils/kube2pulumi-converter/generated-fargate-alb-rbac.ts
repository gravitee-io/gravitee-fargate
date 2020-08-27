import * as pulumi from "@pulumi/pulumi";
import * as kubernetes from "@pulumi/kubernetes";

export const alb_ingress_controllerClusterRole = new kubernetes.rbac.v1.ClusterRole("alb_ingress_controllerClusterRole", {
    apiVersion: "rbac.authorization.k8s.io/v1",
    kind: "ClusterRole",
    metadata: {
        labels: {
            "app.kubernetes.io/name": "alb-ingress-controller",
        },
        name: "alb-ingress-controller",
    },
    rules: [
        {
            apiGroups: [
                "",
                "extensions",
            ],
            resources: [
                "configmaps",
                "endpoints",
                "events",
                "ingresses",
                "ingresses/status",
                "services",
            ],
            verbs: [
                "create",
                "get",
                "list",
                "update",
                "watch",
                "patch",
            ],
        },
        {
            apiGroups: [
                "",
                "extensions",
            ],
            resources: [
                "nodes",
                "pods",
                "secrets",
                "services",
                "namespaces",
            ],
            verbs: [
                "get",
                "list",
                "watch",
            ],
        },
    ],
});
export const alb_ingress_controllerClusterRoleBinding = new kubernetes.rbac.v1.ClusterRoleBinding("alb_ingress_controllerClusterRoleBinding", {
    apiVersion: "rbac.authorization.k8s.io/v1",
    kind: "ClusterRoleBinding",
    metadata: {
        labels: {
            "app.kubernetes.io/name": "alb-ingress-controller",
        },
        name: "alb-ingress-controller",
    },
    roleRef: {
        apiGroup: "rbac.authorization.k8s.io",
        kind: "ClusterRole",
        name: "alb-ingress-controller",
    },
    subjects: [{
        kind: "ServiceAccount",
        name: "alb-ingress-controller",
        namespace: "kube-system",
    }],
});
